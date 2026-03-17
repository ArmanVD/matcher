import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

export const db = new Database(join(dataDir, "wishlist.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS wishlist (
    user_id     TEXT NOT NULL,
    album_id    TEXT NOT NULL,
    album_name  TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    image_url   TEXT,
    release_year TEXT,
    vinyl       TEXT,
    created_at  INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, album_id)
  );

  CREATE TABLE IF NOT EXISTS cache (
    key        TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    timestamp  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id   TEXT PRIMARY KEY,
    slug      TEXT UNIQUE NOT NULL,
    is_public INTEGER DEFAULT 0
  );
`);

export function getWishlistItems(userId) {
  return db
    .prepare("SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId)
    .map((row) => ({
      id: row.album_id,
      name: row.album_name,
      artist: row.artist_name,
      image: row.image_url,
      releaseYear: row.release_year,
      vinyl: JSON.parse(row.vinyl ?? "[]"),
    }));
}

export function addWishlistItem(userId, album) {
  db.prepare(
    `INSERT OR REPLACE INTO wishlist (user_id, album_id, album_name, artist_name, image_url, release_year, vinyl)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    album.id,
    album.name,
    album.artist,
    album.image ?? null,
    album.releaseYear ?? null,
    JSON.stringify(album.vinyl ?? [])
  );
}

export function removeWishlistItem(userId, albumId) {
  db.prepare("DELETE FROM wishlist WHERE user_id = ? AND album_id = ?").run(userId, albumId);
}

export function ensureUserSettings(userId, slug) {
  db.prepare(
    "INSERT OR IGNORE INTO user_settings (user_id, slug, is_public) VALUES (?, ?, 0)"
  ).run(userId, slug);
}

export function getUserPublic(userId) {
  return !!(db.prepare("SELECT is_public FROM user_settings WHERE user_id = ?").get(userId)?.is_public);
}

export function setUserPublic(userId, isPublic) {
  db.prepare("UPDATE user_settings SET is_public = ? WHERE user_id = ?").run(isPublic ? 1 : 0, userId);
}

export function getWishlistBySlug(slug) {
  const row = db.prepare("SELECT user_id, is_public FROM user_settings WHERE slug = ?").get(slug);
  if (!row || !row.is_public) return null;
  return getWishlistItems(row.user_id);
}
