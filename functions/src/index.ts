import type { Request, Response } from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  BggUpstreamError,
  getBoardGame,
  searchBoardGames,
} from "./bgg.js";
import {
  type MediaSummary,
  summarizeMedia,
  tokenMatches,
  validateNote,
} from "./device.js";

const bggApiToken = defineSecret("BGG_API_TOKEN");
const adminApp = getApps()[0] ?? initializeApp();
const adminAuth = getAuth(adminApp);
const ADMIN_EMAILS = new Set(["toupee@gmail.com"]);

const SEARCH_CACHE_CONTROL = "private, max-age=300";
const DETAIL_CACHE_CONTROL = "private, max-age=300";
const CROSS_ORIGIN_CLIENTS = new Set([
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "https://gamingsite-toupee.firebaseapp.com",
  "https://gamingsite-toupee.web.app",
]);

function setCommonHeaders(request: Request, response: Response): boolean {
  const origin = request.get("origin");
  const allowedCrossOrigin = origin ? CROSS_ORIGIN_CLIENTS.has(origin) : true;
  if (origin) response.vary("Origin");
  if (origin && allowedCrossOrigin) {
    response.set("Access-Control-Allow-Origin", origin);
    response.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type");
    response.set("Access-Control-Max-Age", "3600");
  }
  response.set("X-Content-Type-Options", "nosniff");
  return allowedCrossOrigin;
}

function routeParts(path: string): string[] {
  const parts = path.split("/").filter(Boolean);
  const boardgamesIndex = parts.lastIndexOf("boardgames");
  return boardgamesIndex >= 0 ? parts.slice(boardgamesIndex + 1) : parts;
}

function queryString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function sendError(
  response: Response,
  status: number,
  error: string,
): void {
  response.set("Cache-Control", "no-store");
  response.status(status).json({ error });
}

async function isAuthorizedAdmin(
  request: Request,
  response: Response,
): Promise<boolean> {
  const authorization = request.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) {
    sendError(response, 401, "Authentication required");
    return false;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(match[1]);
    const email = decodedToken.email?.toLocaleLowerCase("en-US");
    if (!email || decodedToken.email_verified !== true || !ADMIN_EMAILS.has(email)) {
      sendError(response, 403, "Admin access required");
      return false;
    }
    return true;
  } catch (error) {
    logger.warn("Rejected invalid Firebase ID token", {
      message: error instanceof Error ? error.message : "token verification failed",
    });
    sendError(response, 401, "Authentication required");
    return false;
  }
}

export const boardgames = onRequest(
  {
    concurrency: 10,
    invoker: "public",
    maxInstances: 1,
    memory: "256MiB",
    region: "us-central1",
    secrets: [bggApiToken],
    timeoutSeconds: 120,
  },
  async (request, response) => {
    const allowedCrossOrigin = setCommonHeaders(request, response);

    if (request.method === "OPTIONS") {
      if (!allowedCrossOrigin) {
        sendError(response, 403, "Origin not allowed");
        return;
      }
      response.set("Cache-Control", "public, max-age=3600");
      response.status(204).send("");
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.set("Allow", "GET, HEAD, OPTIONS");
      sendError(response, 405, "Method not allowed");
      return;
    }

    if (!await isAuthorizedAdmin(request, response)) return;

    const token = bggApiToken.value().trim();
    if (!token) {
      logger.error("BGG_API_TOKEN is not configured");
      sendError(response, 503, "Board game service is not configured");
      return;
    }

    const parts = routeParts(request.path);

    try {
      if (parts.length === 1 && parts[0] === "search") {
        const rawQuery = queryString(request.query.q);
        const query = rawQuery?.trim() ?? "";
        if (query.length < 2 || query.length > 100 || /[\u0000-\u001f\u007f]/.test(query)) {
          sendError(response, 400, "q must be between 2 and 100 printable characters");
          return;
        }

        const rawLimit = request.query.limit;
        const limit = rawLimit === undefined ? 20 : Number(queryString(rawLimit));
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
          sendError(response, 400, "limit must be an integer between 1 and 50");
          return;
        }

        const results = await searchBoardGames(query, token);
        response.set("Cache-Control", SEARCH_CACHE_CONTROL);
        response.status(200).json({ results: results.slice(0, limit) });
        return;
      }

      if (parts.length === 1 && /^[1-9]\d{0,8}$/.test(parts[0])) {
        const id = Number(parts[0]);
        const game = await getBoardGame(id, token);
        if (!game) {
          sendError(response, 404, "Board game not found");
          return;
        }

        response.set("Cache-Control", DETAIL_CACHE_CONTROL);
        response.status(200).json({ game });
        return;
      }

      sendError(response, 404, "Board game endpoint not found");
    } catch (error) {
      if (error instanceof BggUpstreamError) {
        logger.warn("BoardGameGeek request failed", {
          status: error.status,
          message: error.message,
        });
        if (error.retryAfterSeconds !== null) {
          response.set("Retry-After", String(error.retryAfterSeconds));
        }
        const status = error.status === 504 ? 504 : 503;
        sendError(response, status, "BoardGameGeek is temporarily unavailable");
        return;
      }

      logger.error("Unexpected board game proxy failure", error);
      sendError(response, 500, "Unexpected board game service error");
    }
  },
);

// ---------------------------------------------------------------------------
// Device API — quick notes from the reMarkable tablet.
//
//   GET  /device/media   list of media items for the on-device picker
//   POST /device/notes   append one quick note {game_id, content}
//
// Authenticated by the DEVICE_TOKEN secret (Bearer), never by Firebase auth:
// the tablet has no browser to run OAuth in. media_type is derived from the
// referenced game document server-side, so the device cannot mislabel a note.

const deviceToken = defineSecret("DEVICE_TOKEN");

export const device = onRequest(
  {
    concurrency: 10,
    invoker: "public",
    maxInstances: 1,
    memory: "256MiB",
    region: "us-central1",
    secrets: [deviceToken],
    timeoutSeconds: 60,
  },
  async (request, response) => {
    setCommonHeaders(request, response);
    response.set("Cache-Control", "no-store");

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    const authorization = request.get("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    const expected = deviceToken.value().trim();
    if (!expected) {
      logger.error("DEVICE_TOKEN is not configured");
      sendError(response, 503, "Device API is not configured");
      return;
    }
    if (!match || !tokenMatches(match[1].trim(), expected)) {
      sendError(response, 401, "Authentication required");
      return;
    }

    const parts = request.path.split("/").filter(Boolean);
    const route = parts[parts.length - 1] ?? "";
    const db = getFirestore(adminApp);

    try {
      if (request.method === "GET" && route === "media") {
        const snapshot = await db.collection("games").orderBy("name").get();
        const media: MediaSummary[] = [];
        for (const doc of snapshot.docs) {
          const summary = summarizeMedia(doc.id, doc.data());
          if (summary) media.push(summary);
        }
        response.status(200).json({ media });
        return;
      }

      if (request.method === "POST" && route === "notes") {
        const validated = validateNote(request.body);
        if (!validated.ok) {
          sendError(response, 400, validated.error);
          return;
        }

        const gameDoc = await db.collection("games").doc(validated.gameId).get();
        if (!gameDoc.exists) {
          sendError(response, 404, "No such media item");
          return;
        }
        const mediaType = gameDoc.get("media_type") ?? "game";

        const note = await db.collection("quick_notes").add({
          game_id: validated.gameId,
          media_type: mediaType,
          content: validated.content,
          images: [],
          cover_image: null,
          created_at: FieldValue.serverTimestamp(),
        });

        logger.info("Device quick note created", {
          note_id: note.id,
          game_id: validated.gameId,
          media_type: mediaType,
          length: validated.content.length,
        });
        response.status(201).json({ id: note.id });
        return;
      }

      response.set("Allow", "GET, POST, OPTIONS");
      sendError(response, 404, "Device endpoint not found");
    } catch (error) {
      logger.error("Unexpected device API failure", error);
      sendError(response, 500, "Unexpected device API error");
    }
  },
);
