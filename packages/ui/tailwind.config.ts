import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Hardware-inspired colour palette
        panel: {
          bg: "#1a1a1a",
          surface: "#242424",
          border: "#333333",
          highlight: "#444444",
        },
        accent: {
          synth: "#ff6b35", // orange — Novation's signature colour
          sample: "#4ecdc4", // teal
          midi: "#ffe66d", // yellow
        },
        knob: {
          track: "#333",
          fill: "#ff6b35",
          indicator: "#ffffff",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        knob: "3.5rem", // standard knob size
        "knob-sm": "2.5rem",
        "knob-lg": "5rem",
      },
    },
  },
  plugins: [],
};

export default config;
