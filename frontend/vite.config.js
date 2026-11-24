import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // While developing (npm run dev), send API and picture requests to the backend on port 8000.
    // On the server, the backend serves the website itself, so no proxy is needed there.
    proxy: {
      "/product": "http://localhost:8000",
      "/uploads": "http://localhost:8000",
    },
  },
});
