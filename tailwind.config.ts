import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 강원랜드 브랜드 무드 — 다크 (CLAUDE.md §4)
        "bg-base": "#14161C",
        "bg-card": "#1E212B",
        gold: "#C9A45C",
        burgundy: "#6E2B3C",
        ok: "#4CAF7D",
        mid: "#F5C451",
        busy: "#E2695E",
        "text-main": "#F2F3F5",
        "text-sub": "#9CA3AF",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
