import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Ensure this path points to your source directory
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000, // Change this to your desired port
  },
});

