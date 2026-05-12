# Debug Log: Resolving Vercel 404 Errors

## Issue Description
Vercel deployment was returning a **404 Not Found** error immediately after a successful build.

## Root Cause Analysis
The issue was caused by a configuration mismatch between the framework plugin and Vercel's deployment expectations.

### 1. Incorrect Build Output Directory
The project was using the `tanstackStart` plugin in `vite.config.ts`. Even with `ssr: false` enabled, this plugin assumes a full-stack architecture and outputs its build artifacts into a specific subdirectory structure:
- **Expected by Vercel**: `dist/index.html`
- **Actual Output**: `dist/client/index.html`

Vercel's default Vite preset looks for the `index.html` file at the root of the `dist` folder. Because it was nested inside `client/`, Vercel found no entry point and served a 404.

### 2. Hybrid SSR/SPA State
The codebase contained residual TanStack Start SSR components (like `HeadContent`, `Scripts`, and `RootShell` in `__root.tsx`) and entry point logic (`StartClient` in `main.tsx`) that expected a server-side hydration process. This caused hydration mismatches and routing errors when served as a static SPA.

## Resolution
The project was standardized as a pure **TanStack Router SPA** to ensure maximum compatibility with Vercel's static hosting.

### Key Changes:
1.  **Plugin Swap**: Replaced `tanstackStart` with `@tanstack/router-plugin` in `vite.config.ts`. This forces the build to output a standard static structure directly into `dist/`.
2.  **Entry Point Migration**: 
    - Updated `src/main.tsx` to use `RouterProvider` instead of `StartClient`.
    - Simplified `src/routes/__root.tsx` to be a standard React component without SSR shell components.
3.  **Static Shell**: Moved meta tags, fonts, and CSS links into the root `index.html` since the framework is no longer injecting them via the server.
4.  **Cleanup**: Removed `src/start.ts` and other SSR-only configuration files.

## Verification
A local build via `bun run build` confirmed the output is now:
```text
dist/
├── assets/
└── index.html  <-- Correctly located at the root
```
This structure is auto-detected by Vercel and resolves the 404 error.
