import { defineConfig } from "astro/config";

import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  output: "server",
  site: "https://matcherapp.nl",
  security: { checkOrigin: false },

  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/api/") &&
        !page.includes("/dashboard") &&
        !page.includes("/wishlist"),
    }),
  ],

  adapter: node({
    mode: "standalone",
  }),

  vite: {
    ssr: {
      external: ["better-sqlite3"],
    },
    resolve: {
      alias: {
        $components: "/src/components",
      },
    },
  },
});