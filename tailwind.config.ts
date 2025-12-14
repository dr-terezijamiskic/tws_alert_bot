import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#ededed",
        card: "#151515",
        "card-hover": "#1a1a1a",
        border: "#2a2a2a",
        primary: "#3b82f6",
        "primary-hover": "#2563eb",
        danger: "#ef4444",
        "danger-hover": "#dc2626",
        success: "#10b981",
        warning: "#f59e0b",
        muted: "#6b7280",
      },
      fontSize: {
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
      },
    },
  },
  plugins: [],
};

export default config;
