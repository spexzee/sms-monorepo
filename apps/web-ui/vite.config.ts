import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "@mui/material",
      "@mui/system",
      "@mui/icons-material",
      "@mui/x-date-pickers",
      "@emotion/react",
      "@emotion/styled",
      "date-fns",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "@mui/material",
      "@mui/system",
      "@mui/icons-material",
      "@mui/x-date-pickers",
      "@emotion/react",
      "@emotion/styled",
      "date-fns",
      "zustand",
      "zustand/middleware",
    ],
  },
});
