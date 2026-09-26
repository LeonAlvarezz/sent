import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    Icons({ compiler: "jsx", jsx: "react" }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@z3/admin-core": path.resolve(
        __dirname,
        "../../packages/core/src/index.ts",
      ),
    },
  },
});
