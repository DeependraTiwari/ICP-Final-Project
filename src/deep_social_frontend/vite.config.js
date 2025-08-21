import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

export default defineConfig({  
  optimizeDeps: {
    include: [
      "@dfinity/agent",
      "@dfinity/candid",
      "@dfinity/principal",
      // Include all DFX canister declarations
      "../../declarations/deep_social_backend/index.js",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
    ],
    dedupe: ["@dfinity/agent"],
  },
  build: {    
    emptyOutDir: true,  
    commonjsOptions: {
      include: [/node_modules/, /declarations/],
    },
    rollupOptions: {
      // Make sure Dfinity packages are bundled for browser
      external: [],
    },
  },
});
