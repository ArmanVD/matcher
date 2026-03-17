export async function GET({ request, cookies, redirect }) {
  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.PUBLIC_REDIRECT_URI;

  const state = crypto.randomUUID();

  cookies.set("oauth_state", state, {
    path: "/",
    maxAge: 600,
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });

  const scopes = ["user-top-read", "user-read-recently-played"].join(" ");
  const switchAccount = new URL(request.url).searchParams.get("switch") === "true";

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    ...(switchAccount && { show_dialog: "true" }),
  });

  return redirect(`https://accounts.spotify.com/authorize?${params}`);
}
