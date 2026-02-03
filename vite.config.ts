import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo.svg", "logo.png", "robots.txt"],
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "Guitariz Studio",
        short_name: "Guitariz",
        description: "Interactive Music Studio: Chord AI, Fretboard, Scales, and Theory Lab",
        theme_color: "#060606",
        background_color: "#060606",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "logo2.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "logo2.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "logo2.png",
            sizes: "1080x1080",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "logo2.png",
            sizes: "1080x1080",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "logo2.png",
            sizes: "1080x1080",
            type: "image/png",
            form_factor: "wide",
            label: "Guitariz Studio",
          },
          {
            src: "logo2.png",
            sizes: "1080x1080",
            type: "image/png",
            form_factor: "narrow",
            label: "Guitariz Studio",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,wav}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "ES2020",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-tooltip", "@radix-ui/react-tabs"],
          audio: ["@/lib/chordAudio.ts", "@/lib/chordDetection.ts"],
          vocal: ["@/pages/VocalSplitterPage.tsx"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
