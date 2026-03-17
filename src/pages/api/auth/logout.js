export async function GET({ cookies, redirect }) {
  cookies.delete("spotify_access_token", { path: "/" });
  cookies.delete("spotify_refresh_token", { path: "/" });
  cookies.delete("spotify_user_name", { path: "/" });
  cookies.delete("spotify_user_id", { path: "/" });
  cookies.delete("lastfm_session_key", { path: "/" });
  cookies.delete("lastfm_username", { path: "/" });
  return redirect("/");
}
