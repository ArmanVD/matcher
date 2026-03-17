export async function GET({ cookies, redirect }) {
  cookies.delete("spotify_access_token", { path: "/" });
  return redirect("/");
}
