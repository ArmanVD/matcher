const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
};

async function refreshAccessToken(refreshToken) {
  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) return null;
  return await response.json();
}

/**
 * Returns a valid Spotify access token, refreshing automatically if expired.
 * Returns null if no valid token can be obtained (user must re-login).
 */
export async function getValidToken(cookies) {
  const accessToken = cookies.get("spotify_access_token")?.value;
  if (accessToken) return accessToken;

  const refreshToken = cookies.get("spotify_refresh_token")?.value;
  if (!refreshToken) return null;

  const data = await refreshAccessToken(refreshToken);
  if (!data?.access_token) return null;

  const secure = import.meta.env.PROD;

  cookies.set("spotify_access_token", data.access_token, {
    ...COOKIE_OPTS,
    maxAge: 3600,
    secure,
  });

  if (data.refresh_token) {
    cookies.set("spotify_refresh_token", data.refresh_token, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 30,
      secure,
    });
  }

  return data.access_token;
}
