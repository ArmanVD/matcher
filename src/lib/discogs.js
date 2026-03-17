// Album-level cache shared across all users — vinyl listings change rarely
const vinylCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Concurrency limiter — max 3 simultaneous Discogs requests
let running = 0;
const queue = [];
const MAX_CONCURRENT = 3;

async function acquire() {
  if (running < MAX_CONCURRENT) {
    running++;
    return;
  }
  await new Promise((resolve) => queue.push(resolve));
  running++;
}

function release() {
  running--;
  if (queue.length > 0) queue.shift()();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchVinylByAlbum(artist, albumName) {
  const cacheKey = `${artist.toLowerCase()}__${albumName.toLowerCase()}`;
  const cached = vinylCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await acquire();
  try {
    const token = import.meta.env.DISCOGS_TOKEN;
    const query = `${artist} ${albumName}`;
    const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=vinyl&per_page=10`;
    const headers = {
      Authorization: `Discogs token=${token}`,
      "User-Agent": "Matcher/1.0 +https://matcherapp.nl",
    };

    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url, { headers });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "10");
        await delay(retryAfter * 1000);
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      vinylCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }

    const remaining = response.headers.get("X-Discogs-Ratelimit-Remaining");
    if (remaining && parseInt(remaining) < 5) {
      await delay(2000);
    }

    const data = await response.json();

    const filtered = (data.results ?? []).filter((release) => {
      const title = release.title.toLowerCase();
      return title.includes(artist.toLowerCase()) && title.includes(albumName.toLowerCase());
    });

    const seen = new Set();
    const unique = filtered.filter((release) => {
      const key = release.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const result = unique.slice(0, 2);
    vinylCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } finally {
    release();
  }
}
