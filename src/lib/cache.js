const cache = new Map();

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  // Cache vervalt na 10 minuten
  if (Date.now() - entry.timestamp > 10 * 60 * 1000) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}
