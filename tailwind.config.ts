import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0D1B2E",
        navy: {
          DEFAULT: "#143A66",
          deep: "#0F2A4A",
          soft: "#E8EEF6",
        },
        crimson: {
          DEFAULT: "#9C1B24",
          deep: "#7A1219",
          soft: "#FBEDEE",
        },
        gold: {
          DEFAULT: "#C9A227",
          soft: "#FBF5E2",
        },
        paper: "#F4F5F7",
        rule: "#D7DCE3",
      },
      fontFamily: {
        display: [
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        sans: [
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.04em" }],
        small: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.6rem" }],
        body: ["1rem", { lineHeight: "1.65rem" }],
        lead: ["1.125rem", { lineHeight: "1.75rem" }],
        h3: ["1.25rem", { lineHeight: "1.6rem", letterSpacing: "-0.01em" }],
        h2: ["1.75rem", { lineHeight: "2.1rem", letterSpacing: "-0.02em" }],
        h1: ["2.5rem", { lineHeight: "2.7rem", letterSpacing: "-0.028em" }],
        display: ["3.5rem", { lineHeight: "3.6rem", letterSpacing: "-0.035em" }],
      },
      borderRadius: {
        DEFAULT: "3px",
        md: "4px",
        lg: "6px",
      },
      maxWidth: {
        prose: "62ch",
        shell: "78rem",
      },
      boxShadow: {
        lift: "0 1px 0 0 rgba(13,27,46,0.06), 0 8px 20px -14px rgba(13,27,46,0.35)",
      },
      keyframes: {
        "band-draw": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "seal-settle": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "band-draw": "band-draw 900ms cubic-bezier(0.22,1,0.36,1) 120ms both",
        "seal-settle": "seal-settle 700ms cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
