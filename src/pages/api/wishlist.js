import { getValidToken } from "../../lib/spotifyAuth.js";
import { getWishlistItems, addWishlistItem, removeWishlistItem } from "../../lib/db.js";

function getUserId(cookies) {
  const spotifyId = cookies.get("spotify_user_id")?.value;
  if (spotifyId) return spotifyId;
  const lastfmUsername = cookies.get("lastfm_username")?.value;
  if (lastfmUsername) return `lastfm:${lastfmUsername}`;
  return null;
}

function isAuthorized(cookies) {
  return !!(
    cookies.get("lastfm_username")?.value ||
    cookies.get("spotify_access_token")?.value ||
    cookies.get("spotify_refresh_token")?.value
  );
}

export async function GET({ cookies }) {
  if (!isAuthorized(cookies))
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const userId = getUserId(cookies);
  if (!userId) return new Response(JSON.stringify([]), { status: 200 });

  return new Response(JSON.stringify(getWishlistItems(userId)), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST({ cookies, request }) {
  if (!isAuthorized(cookies))
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const userId = getUserId(cookies);
  if (!userId) return new Response(JSON.stringify({ error: "no user id" }), { status: 400 });

  const album = await request.json();
  addWishlistItem(userId, album);
  return new Response(JSON.stringify({ ok: true }));
}

export async function DELETE({ cookies, request }) {
  if (!isAuthorized(cookies))
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const userId = getUserId(cookies);
  if (!userId) return new Response(JSON.stringify({ error: "no user id" }), { status: 400 });

  const albumId = new URL(request.url).searchParams.get("id");
  if (!albumId) return new Response(JSON.stringify({ error: "no id" }), { status: 400 });

  removeWishlistItem(userId, albumId);
  return new Response(JSON.stringify({ ok: true }));
}
