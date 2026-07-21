import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base: "./" — GitHub Pages 프로젝트 경로(/repo/os/ 등) 어디에 놓아도 동작하는 상대 경로 빌드
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
