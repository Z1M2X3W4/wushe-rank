import { resolve } from "node:path";
import { defineConfig } from "vite";
import vinext from "vinext";

export default defineConfig({
  plugins: [vinext({ nextConfig: { output: "standalone" } })],
  resolve: { alias: { "#vote-storage": resolve("docker/votes-sqlite.ts") } },
});
