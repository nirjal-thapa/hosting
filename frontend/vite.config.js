import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // While developing (npm run dev), send every /api request to the backend on port 8000.
    // On the server, Nginx does the same job.
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
