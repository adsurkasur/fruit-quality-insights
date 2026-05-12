import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      appRoot: "./src",
      // Explicitly point to the standard entry points
      entryClient: "./src/entry-client.tsx",
      entryServer: "./src/entry-server.tsx",
      server: {
        // Use our custom Cloudflare wrapper only when NOT on Vercel
        entry: process.env.VERCEL ? undefined : "./src/server.ts",
      },
    }),
  ],
});
