export async function getTopTracks(accessToken, timeRange = "medium_term") {
  const offsets = [0, 49, 98, 149];

  const fetches = await Promise.all(
    offsets.map((offset) =>
      fetch(`https://api.spotify.com/v1/me/top/tracks?limit=50&offset=${offset}&time_range=${timeRange}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ),
  );

  const results = await Promise.all(fetches.map((r) => r.json()));

  const combined = results.flatMap((data) => data.items ?? []);

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
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  return {
    name: data.display_name,
    image: data.images?.[0]?.url ?? null,
  };
}
