import { defineConfig } from "vitest/config";
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
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Inline framer-motion and testing-library through Vite's resolver.
    // @emotion/styled and @emotion/react are also aliased below to ensure
    // they resolve from apps/web-ui even if hoisted packages look for them.
    server: {
      deps: {
        inline: [
          /@testing-library\//,
          /framer-motion/,
        ],
      },
    },
    // Point react imports at the monorepo-root node_modules (react was
    // hoisted there when we installed it as a root devDependency)
    alias: [
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: path.resolve(__dirname, "../../node_modules/react/jsx-dev-runtime"),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.resolve(__dirname, "../../node_modules/react/jsx-runtime"),
      },
      {
        find: /^react-dom\/client$/,
        replacement: path.resolve(__dirname, "../../node_modules/react-dom/client"),
      },
      {
        find: /^react-dom$/,
        replacement: path.resolve(__dirname, "../../node_modules/react-dom"),
      },
      {
        find: /^react$/,
        replacement: path.resolve(__dirname, "../../node_modules/react"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/components/**"],
    },
  },
});
