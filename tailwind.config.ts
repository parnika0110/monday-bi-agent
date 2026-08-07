import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        lavender: {
          50: "#FAF7FF",
          100: "#F5F0FF",
          200: "#E9E0FF",
          300: "#DCCFFF",
          400: "#CDBEFF",
          500: "#B8A6FF",
          600: "#9E86FF",
          700: "#8062F8",
        },
        pastel: {
          mint: "#A7F3D0",
          yellow: "#FDE68A",
          pink: "#FBCFE8",
          sky: "#BAE6FD",
          rose: "#FECDD3",
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 20px 0 rgba(0, 0, 0, 0.03)",
        "soft-lg": "0 8px 30px 0 rgba(0, 0, 0, 0.04)",
        "lavender-glow": "0 8px 25px -4px rgba(184, 166, 255, 0.25)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
