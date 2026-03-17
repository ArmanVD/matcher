import { defineConfig } from "astro/config";

import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  site: "https://matcherapp.nl",

  adapter: node({
    mode: "standalone",
  }),

  vite: {
    ssr: {
      external: ["better-sqlite3"],
    },
  },
});