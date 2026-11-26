import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import fs from "node:fs";

const rootEnvPath = path.resolve(import.meta.dirname, "../../.env");
const hasRootEnv = fs.existsSync(rootEnvPath);
const resolvedEnvDir = hasRootEnv
  ? path.resolve(import.meta.dirname, "../../")
  : path.resolve(import.meta.dirname, "./");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolvedEnvDir, "");
  const apiTarget = env.VITE_API_PROD_URL || `http://localhost:${env.PORT || 3001}`;
  const webPort = Number(env.VITE_PORT || 3000);

  return {
    envDir: resolvedEnvDir,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Notepad",
        short_name: "Notepad",
        description: "Windows 11 Notepad Cloud - End-to-end encrypted notes",
        theme_color: "#0078D4",
        background_color: "#202020",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@notepad/core": path.resolve(import.meta.dirname, "../../packages/core/src"),
      "@notepad/web": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: webPort,
    proxy: {
      "/auth": {
        target: apiTarget,
        changeOrigin: true,
        bypass: (req) => {
          if (
            req.url &&
            (req.url.startsWith("/auth/callback") ||
              req.url.startsWith("/auth/drive-callback") ||
              req.url === "/auth/callback" ||
              req.url === "/auth/drive-callback")
          ) {
            return "/index.html";
          }
        },
      },
      "/sync": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/account": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
  };
});
