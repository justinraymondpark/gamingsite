import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_NOTE_LENGTH,
  summarizeMedia,
  tokenMatches,
  validateNote,
} from "./device.js";

test("accepts a well-formed note and trims it", () => {
  const result = validateNote({ game_id: "abc-123_XY", content: "  Loved the ending.  " });
  assert.deepEqual(result, { ok: true, gameId: "abc-123_XY", content: "Loved the ending." });
});

test("rejects non-object bodies", () => {
  for (const body of [null, "note", 42, ["a"]]) {
    const result = validateNote(body);
    assert.equal(result.ok, false);
  }
});

test("rejects bad ids", () => {
  for (const id of ["", "a/b", "a".repeat(129), 7, undefined]) {
    const result = validateNote({ game_id: id, content: "x" });
    assert.equal(result.ok, false);
  }
});

test("rejects empty and oversized content", () => {
  assert.equal(validateNote({ game_id: "a", content: "   " }).ok, false);
  assert.equal(
    validateNote({ game_id: "a", content: "x".repeat(MAX_NOTE_LENGTH + 1) }).ok,
    false,
  );
  assert.equal(
    validateNote({ game_id: "a", content: "x".repeat(MAX_NOTE_LENGTH) }).ok,
    true,
  );
});

test("token comparison accepts only the exact token", () => {
  assert.equal(tokenMatches("secret", "secret"), true);
  assert.equal(tokenMatches("secret2", "secret"), false);
  assert.equal(tokenMatches("", "secret"), false);
  assert.equal(tokenMatches("secret", ""), false);
});

test("summarizes media with the right byline per type", () => {
  assert.deepEqual(
    summarizeMedia("id1", { name: "OK Computer", media_type: "music", artist: "Radiohead" }),
    { id: "id1", name: "OK Computer", media_type: "music", byline: "Radiohead" },
  );
  assert.deepEqual(
    summarizeMedia("id2", { name: "Dune", media_type: "book", author: "Frank Herbert" }),
    { id: "id2", name: "Dune", media_type: "book", byline: "Frank Herbert" },
  );
  assert.deepEqual(
    summarizeMedia("id3", { name: "Hades", released: "2020-09-17" }),
    { id: "id3", name: "Hades", media_type: "game", byline: "2020" },
  );
});

test("drops unusable media records instead of failing the list", () => {
  assert.equal(summarizeMedia("x", { media_type: "game" }), null);
  assert.equal(summarizeMedia("x", { name: "A", media_type: "hologram" }), null);
});
