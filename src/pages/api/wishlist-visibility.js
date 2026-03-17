import { ensureUserSettings, getUserPublic, setUserPublic } from "../../lib/db.js";

function getAuth(cookies) {
  const spotifyId = cookies.get("spotify_user_id")?.value;
  if (spotifyId) {
    const spotifyName = cookies.get("spotify_user_name")?.value ?? spotifyId;
    return { userId: spotifyId, slug: spotifyId };
  }
  const lastfmUsername = cookies.get("lastfm_username")?.value;
  if (lastfmUsername) {
    return { userId: `lastfm:${lastfmUsername}`, slug: `lastfm-${lastfmUsername}` };
  }
  return null;
}

export async function GET({ cookies }) {
  const auth = getAuth(cookies);
  if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  ensureUserSettings(auth.userId, auth.slug);
  const isPublic = getUserPublic(auth.userId);

  return new Response(JSON.stringify({ isPublic, slug: auth.slug }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST({ cookies, request }) {
  const auth = getAuth(cookies);
  if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const { isPublic } = await request.json();
  ensureUserSettings(auth.userId, auth.slug);
  setUserPublic(auth.userId, isPublic);

  return new Response(JSON.stringify({ ok: true, slug: auth.slug }));
}
