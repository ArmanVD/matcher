import { getValidToken } from "../../lib/spotifyAuth.js";
import { getWishlistItems, addWishlistItem, removeWishlistItem } from "../../lib/db.js";

function getUserId(cookies) {
  return cookies.get("spotify_user_id")?.value ?? null;
}

export async function GET({ cookies }) {
  const token = await getValidToken(cookies);
  if (!token) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const userId = getUserId(cookies);
  if (!userId) return new Response(JSON.stringify([]), { status: 200 });

  return new Response(JSON.stringify(getWishlistItems(userId)), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST({ cookies, request }) {
  const token = await getValidToken(cookies);
  if (!token) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const userId = getUserId(cookies);
  if (!userId) return new Response(JSON.stringify({ error: "no user id" }), { status: 400 });

  const album = await request.json();
  addWishlistItem(userId, album);
  return new Response(JSON.stringify({ ok: true }));
}

export async function DELETE({ cookies, request }) {
  const token = await getValidToken(cookies);
  if (!token) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const userId = getUserId(cookies);
  if (!userId) return new Response(JSON.stringify({ error: "no user id" }), { status: 400 });

  const albumId = new URL(request.url).searchParams.get("id");
  if (!albumId) return new Response(JSON.stringify({ error: "no id" }), { status: 400 });

  removeWishlistItem(userId, albumId);
  return new Response(JSON.stringify({ ok: true }));
}
