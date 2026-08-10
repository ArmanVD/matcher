/**
 * Fout met een machineleesbare `code` zodat de aanroeper er gericht op kan reageren:
 * - "forbidden"    → token ongeldig of mist de user-top-read-scope → nieuwe consent nodig.
 * - "rate_limited" → Spotify rate limit → nette melding, later opnieuw (retryAfter in sec).
 */
export class SpotifyError extends Error {
  constructor(code, message, retryAfter) {
    super(message);
    this.name = "SpotifyError";
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export async function getTopTracks(accessToken, timeRange = "medium_term") {
  const offsets = [0, 49, 98, 149];

  const responses = await Promise.all(
    offsets.map((offset) =>
      fetch(`https://api.spotify.com/v1/me/top/tracks?limit=50&offset=${offset}&time_range=${timeRange}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ),
  );

  // 401/403: token is ongeldig of mist de user-top-read-scope (bv. een oude toestemming
  // van vóór de scope werd toegevoegd). Doorgooien zodat de aanroeper de gebruiker naar
  // een nieuwe consent stuurt, i.p.v. stilletjes "geen data" te tonen.
  if (responses.some((r) => r.status === 401 || r.status === 403)) {
    throw new SpotifyError("forbidden", "Spotify weigert de top-data (token/scope).");
  }

  // 429: alleen deze request faalt. NIET globaal wegschrijven — dat blokkeerde voorheen
  // álle gebruikers tegelijk via één gedeeld /tmp-bestand.
  const limited = responses.find((r) => r.status === 429);
  if (limited) {
    const retryAfter = parseInt(limited.headers.get("Retry-After") ?? "30", 10);
    throw new SpotifyError("rate_limited", "Spotify rate limit bereikt.", retryAfter);
  }

  const datas = await Promise.all(responses.map((r) => (r.ok ? r.json() : { items: [] })));
  const combined = datas.flatMap((data) => data.items ?? []);

  // Verwijder duplicaten op track ID
  const seen = new Set();
  return combined.filter((track) => {
    if (seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  });
}

export function groupByArtist(tracks) {
  const artistMap = {};

  for (const track of tracks) {
    const album = track.album;
    const artistId = album.artists[0].id;
    const artistName = album.artists[0].name;
    const albumId = album.id;

    if (!artistMap[artistId]) {
      artistMap[artistId] = {
        id: artistId,
        name: artistName,
        albums: {},
      };
    }

    if (!artistMap[artistId].albums[albumId]) {
      artistMap[artistId].albums[albumId] = {
        id: albumId,
        name: album.name,
        image: album.images[0]?.url ?? null,
        imageMedium: album.images[1]?.url ?? null,
        releaseYear: album.release_date?.split("-")[0] ?? null,
        tracks: [],
      };
    }

    artistMap[artistId].albums[albumId].tracks.push(track.name);
  }

  // Sorteer artiesten op totaal aantal tracks
  return Object.values(artistMap)
    .map((artist) => {
      const seenAlbums = new Set();
      const uniqueAlbums = Object.values(artist.albums)
        .filter((album) => {
          const key = album.name.toLowerCase().trim();
          if (seenAlbums.has(key)) return false;
          seenAlbums.add(key);
          return true;
        })
        .sort((a, b) => b.tracks.length - a.tracks.length);

      return {
        ...artist,
        albums: uniqueAlbums,
        totalTracks: uniqueAlbums.reduce((sum, a) => sum + a.tracks.length, 0),
      };
    })
    .sort((a, b) => b.totalTracks - a.totalTracks);
}

export async function getUser(accessToken) {
  // Header-info (naam/avatar): faalt zacht — bij een fout gewoon leeg, geen throw,
  // zodat het dashboard blijft laden ook als /me even niet lukt.
  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return { name: null, image: null };
    const data = await response.json();
    return {
      name: data.display_name,
      image: data.images?.[0]?.url ?? null,
    };
  } catch {
    return { name: null, image: null };
  }
}
