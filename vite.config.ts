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
    {
      name: "cors-proxy",
      configureServer(server) {
        server.middlewares.use("/api/proxy", async (req, res, next) => {
          try {
            const url = new URL(req.url!, `http://${req.headers.host}`);
            const targetUrl = url.searchParams.get("url");

            // Handle preflight OPTIONS
            if (req.method === "OPTIONS") {
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
              res.setHeader("Access-Control-Allow-Headers", "Content-Type");
              res.statusCode = 204;
              res.end();
              return;
            }

            if (!targetUrl) {
              res.statusCode = 400;
              res.end("Missing url query parameter");
              return;
            }

            // Prepare headers to forward
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (key !== "host" && key !== "origin" && key !== "referer" && value) {
                headers.set(key, Array.isArray(value) ? value.join(",") : value);
              }
            }

            // Prepare body
            let body: Buffer | undefined = undefined;
            if (req.method !== "GET" && req.method !== "HEAD") {
              // Collect body data
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              body = Buffer.concat(buffers);
            }

            const response = await fetch(targetUrl, {
              method: req.method,
              headers: headers,
              body: body,
            });

            // Forward response
            res.statusCode = response.status;
            res.setHeader("Access-Control-Allow-Origin", "*");
            response.headers.forEach((value, key) => {
              // Avoid duplicate cors headers or encoding issues
              if (key.toLowerCase() !== "content-encoding" && key.toLowerCase() !== "content-length" && !key.startsWith("access-control-")) {
                res.setHeader(key, value);
              }
            });

            const arrayBuffer = await response.arrayBuffer();
            res.write(Buffer.from(arrayBuffer));
            res.end();

          } catch (e) {
            console.error("Proxy error:", e);
            res.statusCode = 500;
            res.end("Proxy error: " + String(e));
          }
        });
      },
    },
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
