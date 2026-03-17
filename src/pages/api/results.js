import { getTopTracks, groupByArtist } from "../../lib/spotify.js";
import { getTopAlbums, groupAlbumsByArtist } from "../../lib/lastfm.js";
import { searchVinylByAlbum } from "../../lib/discogs.js";
import { getCached, setCached } from "../../lib/cache.js";
import { getValidToken } from "../../lib/spotifyAuth.js";

const LASTFM_PERIODS = {
  short_term: "1month",
  medium_term: "6month",
  long_term: "12month",
};

async function getUserHash(id) {
  const data = new TextEncoder().encode(id);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function GET({ request, cookies }) {
  const url = new URL(request.url);
  const timeRange = url.searchParams.get("period") ?? "medium_term";
  const offset = parseInt(url.searchParams.get("offset") ?? "0");
  const limit = 5;

  // Last.fm flow
  const lastfmUsername = cookies.get("lastfm_username")?.value;
  if (lastfmUsername) {
    const userHash = await getUserHash(`lastfm_${lastfmUsername}`);
    const cacheKey = `${userHash}_results_${timeRange}_${offset}`;
    let results = getCached(cacheKey);

    if (!results) {
      const artistsCacheKey = `${userHash}_artists_${timeRange}`;
      let artists = getCached(artistsCacheKey);

      if (!artists) {
        const period = LASTFM_PERIODS[timeRange] ?? "6month";
        const albums = await getTopAlbums(lastfmUsername, period);
        artists = groupAlbumsByArtist(albums);
        setCached(artistsCacheKey, artists);
      }

      const chunk = artists.slice(offset, offset + limit);
      results = [];

      for (const artist of chunk) {
        const topAlbums = artist.albums.slice(0, 3);
        const albumsWithVinyl = await Promise.all(
          topAlbums.map(async (album) => {
            const vinyl = await searchVinylByAlbum(artist.name, album.name);
            return { ...album, vinyl };
          })
        );
        results.push({
          artist: { name: artist.name, totalTracks: artist.totalPlays, source: "lastfm" },
          albums: albumsWithVinyl,
        });
      }

      setCached(cacheKey, results);
    }

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=600" },
    });
  }

  // Spotify flow
  const accessToken = await getValidToken(cookies);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const userHash = await getUserHash(accessToken);
  const cacheKey = `${userHash}_results_${timeRange}_${offset}`;
  let results = getCached(cacheKey);

  if (!results) {
    const tracksCacheKey = `${userHash}_tracks_${timeRange}`;
    let artists = getCached(tracksCacheKey);

    if (!artists) {
      const tracks = await getTopTracks(accessToken, timeRange);
      artists = groupByArtist(tracks);
      setCached(tracksCacheKey, artists);
    }

    const chunk = artists.slice(offset, offset + limit);
    results = [];

    for (const artist of chunk) {
      const topAlbums = artist.albums.slice(0, 3);
      const albumsWithVinyl = await Promise.all(
        topAlbums.map(async (album) => {
          const vinyl = await searchVinylByAlbum(artist.name, album.name);
          return { ...album, vinyl };
        })
      );
      results.push({ artist, albums: albumsWithVinyl });
    }

    setCached(cacheKey, results);
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=600" },
  });
}
