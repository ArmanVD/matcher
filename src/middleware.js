import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://analytics.matcherapp.nl",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://i.scdn.co https://lastfm.freetls.fastly.net data:",
      "font-src 'self'",
      "connect-src 'self' https://api.spotify.com https://api.discogs.com https://accounts.spotify.com https://analytics.matcherapp.nl",
      "frame-ancestors 'none'",
    ].join("; "),
  );

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
});
