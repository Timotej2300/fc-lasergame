import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        panel: "#12121a",
        panel2: "#191924",
        accent: "#ff2d55",
        accent2: "#00e5ff",
        ok: "#22c55e",
        warn: "#f59e0b",
        danger: "#ef4444"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"]
      },
      animation: {
        pulseSlow: "pulse 2.5s ease-in-out infinite",
        popIn: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"
      },
      keyframes: {
        popIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;
