// Device API — lets the reMarkable tablet post quick notes without a browser
// or Google OAuth. Mirrors the hell-toupee site's device route: a single
// shared secret held as a Functions secret, compared in constant time.
//
// The tablet is a trusted single-user client on a personal site, so a bearer
// token is the right weight. What the token does NOT get you: media creation,
// review writes, deletes — the endpoint can only read the media list and
// append quick notes.

import { createHash, timingSafeEqual } from "node:crypto";

export type MediaType =
  | "game"
  | "boardgame"
  | "music"
  | "guitar"
  | "book"
  | "movie"
  | "tv";

const MEDIA_TYPES = new Set<string>([
  "game",
  "boardgame",
  "music",
  "guitar",
  "book",
  "movie",
  "tv",
]);

export const MAX_NOTE_LENGTH = 20_000;

// Hash both sides so the comparison is constant-time even when lengths differ;
// timingSafeEqual throws on unequal lengths, which would itself be a signal.
export function tokenMatches(presented: string, expected: string): boolean {
  if (expected.length === 0) return false;
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export type NoteValidation =
  | { ok: true; gameId: string; content: string }
  | { ok: false; error: string };

// game_id is a Firestore auto-id or an imported id — printable, no slashes.
const GAME_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function validateNote(body: unknown): NoteValidation {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const gameId = (body as Record<string, unknown>).game_id;
  const content = (body as Record<string, unknown>).content;

  if (typeof gameId !== "string" || !GAME_ID_PATTERN.test(gameId)) {
    return { ok: false, error: "game_id must be a valid media id" };
  }
  if (typeof content !== "string") {
    return { ok: false, error: "content must be a string" };
  }
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "content must not be empty" };
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    return { ok: false, error: `content must be at most ${MAX_NOTE_LENGTH} characters` };
  }
  return { ok: true, gameId, content: trimmed };
}

// The picker on the tablet needs a name, a type, and a one-line byline to
// disambiguate (artist for music, author for books, year for the rest).
export type MediaSummary = {
  id: string;
  name: string;
  media_type: MediaType;
  byline: string;
};

export function summarizeMedia(
  id: string,
  data: Record<string, unknown>,
): MediaSummary | null {
  const name = data.name;
  const mediaType = data.media_type ?? "game";
  if (typeof name !== "string" || name.length === 0) return null;
  if (typeof mediaType !== "string" || !MEDIA_TYPES.has(mediaType)) return null;

  let byline = "";
  if (typeof data.artist === "string" && data.artist) byline = data.artist;
  else if (typeof data.author === "string" && data.author) byline = data.author;
  else if (typeof data.released === "string" && data.released) {
    byline = data.released.slice(0, 4);
  }

  return { id, name, media_type: mediaType as MediaType, byline };
}
