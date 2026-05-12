import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: {
        entry: process.env.VERCEL ? undefined : "./src/server.ts",
      },
    }),
  ],
});
