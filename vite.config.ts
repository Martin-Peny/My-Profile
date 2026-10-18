import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [react(), vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep the 3D engine separate from the page and cache its two native modules.
          if (id.includes("/three/")) {
            return id.includes("three.core") ? "three-core" : "three-renderer";
          }
        },
      },
    },
  },
});
