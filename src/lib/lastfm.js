import { createHash } from "node:crypto";

const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

function apiSig(params) {
  const secret = import.meta.env.LASTFM_API_SECRET;
  const str =
    Object.keys(params)
      .filter((k) => k !== "format")
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("") + secret;
  return createHash("md5").update(str, "utf8").digest("hex");
}

export async function getSessionKey(token) {
  const apiKey = import.meta.env.LASTFM_API_KEY;
  const params = { method: "auth.getSession", api_key: apiKey, token };
  const sig = apiSig(params);
  const url = `${BASE_URL}?method=auth.getSession&api_key=${apiKey}&token=${token}&api_sig=${sig}&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.message ?? "Last.fm auth failed");
  return data.session; // { name, key, subscriber }
}

export async function getUser(username) {
  const apiKey = import.meta.env.LASTFM_API_KEY;
  const url = `${BASE_URL}?method=user.getinfo&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { name: username, image: null };
    const data = await res.json();
    if (data.error) return { name: username, image: null };
    const profile = data.user;
    const image =
      profile.image?.find((i) => i.size === "large")?.["#text"] || null;
    return {
      name: profile.realname || profile.name,
      image: image && !image.includes("2a96cbd8b46e442fc41c2b86b821562f") ? image : null,
    };
  } catch {
    return { name: username, image: null };
  }
}

export async function getTopAlbums(username, period) {
  const apiKey = import.meta.env.LASTFM_API_KEY;
  const url = `${BASE_URL}?method=user.gettopalbums&user=${encodeURIComponent(username)}&period=${period}&limit=200&api_key=${apiKey}&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error || !data.topalbums?.album) return [];

  return data.topalbums.album.map((album) => ({
    id: album.mbid || `${album.artist.name}::${album.name}`,
    name: album.name,
    artist: album.artist.name,
    playcount: parseInt(album.playcount) || 0,
    image: null,
    releaseYear: null,
  }));
}

export function groupAlbumsByArtist(albums) {
  const artistMap = new Map();
  for (const album of albums) {
    if (!artistMap.has(album.artist)) {
      artistMap.set(album.artist, { name: album.artist, totalPlays: 0, albums: [] });
    }
    const artist = artistMap.get(album.artist);
    artist.totalPlays += album.playcount;
    artist.albums.push(album);
  }
  return Array.from(artistMap.values()).sort((a, b) => b.totalPlays - a.totalPlays);
}
