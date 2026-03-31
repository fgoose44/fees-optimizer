import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System — aus DESIGN.md + Stitch-Screens
        primary: "#005280",
        "primary-container": "#106ba3",
        "primary-fixed": "#cde5ff",
        "primary-fixed-dim": "#95ccff",
        "on-primary": "#ffffff",
        "on-primary-container": "#d2e7ff",
        "on-primary-fixed": "#001d32",
        "on-primary-fixed-variant": "#004a75",
        "inverse-primary": "#95ccff",

        secondary: "#006e1c",
        "secondary-container": "#91f78e",
        "secondary-fixed": "#94f990",
        "secondary-fixed-dim": "#78dc77",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00731e",
        "on-secondary-fixed": "#002204",
        "on-secondary-fixed-variant": "#005313",

        tertiary: "#a10012",
        "tertiary-container": "#c52427",
        "tertiary-fixed": "#ffdad6",
        "tertiary-fixed-dim": "#ffb3ac",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#ffddda",
        "on-tertiary-fixed": "#410003",
        "on-tertiary-fixed-variant": "#930010",

        // Surfaces
        background: "#f8f9fa",
        surface: "#f8f9fa",
        "surface-bright": "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-variant": "#e1e3e4",
        "surface-tint": "#006399",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",

        // On-Surface
        "on-surface": "#191c1d",
        "on-surface-variant": "#40474f",
        "on-background": "#191c1d",
        "inverse-surface": "#2e3132",
        "inverse-on-surface": "#f0f1f2",

        // Outlines
        outline: "#717881",
        "outline-variant": "#c0c7d1",

        // Error
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
