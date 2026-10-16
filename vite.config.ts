/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 배포 시 리포 이름 경로(/todo-manager/)를 base로 사용합니다.
// 로컬 개발(npm run dev)에서는 "/" 입니다.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  test: {
    environment: "node",
  },
});
