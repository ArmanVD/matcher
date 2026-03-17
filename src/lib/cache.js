import { db } from "./db.js";

const TTL = 6 * 60 * 60 * 1000; // 6 uur

// Ruim verlopen entries op bij serverstart
db.prepare("DELETE FROM cache WHERE timestamp < ?").run(Date.now() - TTL);

export function getCached(key) {
  const row = db.prepare("SELECT data, timestamp FROM cache WHERE key = ?").get(key);
  if (!row) return null;

  if (Date.now() - row.timestamp > TTL) {
    db.prepare("DELETE FROM cache WHERE key = ?").run(key);
    return null;
  }

  return JSON.parse(row.data);
}

export function setCached(key, data) {
  db.prepare(
    "INSERT OR REPLACE INTO cache (key, data, timestamp) VALUES (?, ?, ?)"
  ).run(key, JSON.stringify(data), Date.now());
}
