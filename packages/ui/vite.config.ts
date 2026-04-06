import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(__dirname, "."), // додай це
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls to Bun backend during development
      "/api": {
        target: "http://localhost:3847",
        changeOrigin: true,
      },
      // Proxy WebSocket connections
      "/ws": {
        target: "ws://localhost:3847",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
