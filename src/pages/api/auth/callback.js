export async function GET({ request, cookies, redirect }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return redirect("/?error=access_denied");
  }

  const storedState = cookies.get("oauth_state")?.value;
  cookies.delete("oauth_state", { path: "/" });

  if (!state || !storedState || state !== storedState) {
    return redirect("/?error=invalid_state");
  }

  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = import.meta.env.PUBLIC_REDIRECT_URI;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    return redirect("/?error=token_failed");
  }

  cookies.set("spotify_access_token", data.access_token, {
    path: "/",
    maxAge: 3600,
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });

  if (data.refresh_token) {
    cookies.set("spotify_refresh_token", data.refresh_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      secure: import.meta.env.PROD,
    });
  }

  try {
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      const displayName = profile.display_name || profile.id;
      if (displayName) {
        cookies.set("spotify_user_name", displayName, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          httpOnly: true,
          sameSite: "lax",
          secure: import.meta.env.PROD,
        });
      }
    }
  } catch {}

  return redirect("/dashboard");
}
