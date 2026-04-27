import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        gold: {
          50: "#fefce8", 100: "#fef9c3", 200: "#fef08a",
          300: "#fde047", 400: "#facc15", 500: "#eab308",
          600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12",
        },
        obsidian: {
          50: "#f8f7f4", 100: "#ede9e0", 200: "#d9d0c0",
          300: "#c2b39b", 400: "#a8937a", 500: "#92785f",
          600: "#7a6250", 700: "#614e42", 800: "#4a3c34",
          900: "#2c2218", 950: "#1a1410",
        },
        sol: {
          purple: "#9945FF", green: "#14F195",
          teal: "#00C2FF", pink: "#FF6FD8",
        }
      },
      backgroundImage: {
        "kente": "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(234,179,8,0.1) 10px, rgba(234,179,8,0.1) 20px)",
        "adire": "radial-gradient(ellipse at center, rgba(234,179,8,0.15) 0%, transparent 70%)",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "card-deal": "card-deal 0.4s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
        "kente-shift": "kente-shift 8s linear infinite",
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(234,179,8,0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(234,179,8,0.8), 0 0 80px rgba(234,179,8,0.3)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "card-deal": {
          "0%": { opacity: "0", transform: "translateY(-100px) rotate(-10deg) scale(0.8)" },
          "100%": { opacity: "1", transform: "translateY(0) rotate(0deg) scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "kente-shift": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "200px 200px" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
