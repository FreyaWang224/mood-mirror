import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["test/**/*.test.ts"],
  },
  plugins: [
    cloudflareTest({
      wrangler: {
      configPath: "./wrangler.jsonc",
      },
      miniflare: {
        bindings: {
          DIARY_ACCESS_TOKEN: "test-access-token",
        },
        d1Databases: ["DB"],
      },
    }),
  ],
});
