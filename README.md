# Matcher

**Matcher** links your music listening history to vinyl listings on Discogs — so you can discover which albums from your top artists are available on vinyl.

Log in with **Spotify** or **Last.fm**, browse your top artists by time period, and find vinyl releases directly on Discogs.

Live at [matcherapp.nl](https://matcherapp.nl)

---

## Features

- Login with **Spotify** or **Last.fm**
- Browse top artists by period: last month, 6 months, or last year
- See which albums are available on vinyl via **Discogs**
- Save albums to a **wishlist** (synced across devices)
- Filter to only show artists with available vinyl
- Mobile-friendly

---

## Tech stack

- [Astro](https://astro.build) with SSR (`@astrojs/node` standalone adapter)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api) — top tracks & user info
- [Last.fm API](https://www.last.fm/api) — top albums & user info
- [Discogs API](https://www.discogs.com/developers) — vinyl listings
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — wishlist persistence
- PM2 + Nginx on a Ubuntu VPS

---

## Local setup

**Prerequisites:** Node.js >= 22.12.0

```bash
git clone https://github.com/armanvd/matcher.git
cd matcher
npm install
```

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Start the dev server:

```bash
npm run dev
```

---

## Environment variables

| Variable | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |
| `PUBLIC_REDIRECT_URI` | Spotify OAuth callback URL |
| `DISCOGS_TOKEN` | Discogs personal access token |
| `LASTFM_API_KEY` | Last.fm API key |
| `LASTFM_API_SECRET` | Last.fm shared secret |
| `LASTFM_CALLBACK_URI` | Last.fm OAuth callback URL |

### Getting credentials

**Spotify:** Create an app at [developer.spotify.com](https://developer.spotify.com/dashboard). Add your callback URL to the allowed redirect URIs. Note: Spotify limits development mode apps to 5 users.

**Last.fm:** Register an app at [last.fm/api/account/create](https://www.last.fm/api/account/create). No user limits.

**Discogs:** Generate a personal access token at [discogs.com/settings/developers](https://www.discogs.com/settings/developers).

---

## Using Last.fm

Last.fm requires scrobbling to be set up before Matcher can show results:

1. Create a free account at [last.fm/join](https://www.last.fm/join)
2. Enable **Spotify Scrobbling** in [Last.fm settings → Applications](https://www.last.fm/settings/applications)
3. Listen to music on Spotify — after 1–2 days Matcher will have enough data to show matches

---

## Deployment

The app is deployed on a Ubuntu VPS with PM2 and Nginx. A `deploy.sh` script handles building and syncing files via rsync.

```bash
npm run build
./deploy.sh
```

On the server, PM2 runs the Node.js server and Nginx acts as a reverse proxy with SSL via Let's Encrypt.

---

Made by [avek.dev](https://avek.dev)
