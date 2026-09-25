import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#12233F",
        blue: { DEFAULT: "#2557B0", light: "#E8EEF9" },
        // A flat string here (as this used to be) replaces Tailwind's whole
        // default `amber` color object instead of adding to it — every
        // `amber-50`..`amber-900` utility across the app (121 usages) was
        // silently generating no CSS at all as a result. Keep the brand hex
        // as DEFAULT (bare `bg-amber`/`text-amber`, used in a few places)
        // and restore Tailwind's real numbered shades for everything else.
        amber: {
          DEFAULT: "#E8A33D",
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        ash: "#F6F6F4",
        steel: "#5B6472",
        ink: "#14181F",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;