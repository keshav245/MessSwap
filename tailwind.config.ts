import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1C1A17",
        paper: "#FBF7EE",
        turmeric: "#E8A93B",
        turmericDark: "#C98A22",
        chutney: "#5C7A4C",
        chili: "#C4472E",
        steel: "#6B655C",
        steelLight: "#D8D2C4",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        stub: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
