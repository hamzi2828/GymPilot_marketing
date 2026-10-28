import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        // The public website (reference redesign): Geist for text, Tektur for
        // the wordmark and big numbers. The super-admin panel keeps Inter.
        gp: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
        "gp-brand": ["var(--font-tektur)", "var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Public website palette. Each colour is a CSS variable (globals.css)
        // so the header's barbell switch can flip the site to light mode.
        // Kept apart from `brand` so the super-admin panel is untouched.
        gp: {
          void: "rgb(var(--gp-void) / <alpha-value>)",
          graphite: "rgb(var(--gp-graphite) / <alpha-value>)",
          panel: "rgb(var(--gp-panel) / <alpha-value>)",
          raised: "rgb(var(--gp-raised) / <alpha-value>)",
          slate: "rgb(var(--gp-slate) / <alpha-value>)",
          mist: "rgb(var(--gp-mist) / <alpha-value>)",
          bone: "rgb(var(--gp-bone) / <alpha-value>)",
          ink: "rgb(var(--gp-ink) / <alpha-value>)",
          mint: "rgb(var(--gp-mint) / <alpha-value>)",
          ember: "rgb(var(--gp-ember) / <alpha-value>)",
          paper: "rgb(var(--gp-paper) / <alpha-value>)",
          blue: "rgb(var(--gp-blue) / <alpha-value>)",
          violet: "rgb(var(--gp-violet) / <alpha-value>)",
          edge: "var(--gp-edge)",
          "edge-2": "var(--gp-edge-2)",
        },
        // The product's own colour. The panel and the marketing site share it
        // so GymsPilotPro looks like one thing everywhere it appears.
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        lift: "0 20px 50px -20px rgba(15,23,42,0.35)",
        glow: "0 0 0 1px rgba(99,102,241,0.25), 0 20px 60px -20px rgba(99,102,241,0.55)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%": { transform: "translateY(-12px) rotate(1deg)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        grow: {
          from: { transform: "scaleY(0)" },
          to: { transform: "scaleY(1)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        grow: "grow 1.2s cubic-bezier(0.22, 1, 0.36, 1) both",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
