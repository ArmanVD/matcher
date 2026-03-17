import { getSessionKey } from "../../../lib/lastfm.js";

export async function GET({ request, cookies, redirect }) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return redirect("/?error=access_denied");

  try {
    const session = await getSessionKey(token);

    const cookieOpts = {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
      secure: import.meta.env.PROD,
    };

    cookies.set("lastfm_session_key", session.key, cookieOpts);
    cookies.set("lastfm_username", session.name, cookieOpts);

    return redirect("/dashboard");
  } catch {
    return redirect("/?error=token_failed");
  }
}
