export async function GET({ redirect }) {
  const apiKey = import.meta.env.LASTFM_API_KEY;
  const callbackUri = import.meta.env.LASTFM_CALLBACK_URI;
  return redirect(
    `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(callbackUri)}`
  );
}
