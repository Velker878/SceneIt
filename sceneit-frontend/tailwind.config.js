/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Core palette — deep cinematic dark with warm film-reel amber accent
        scene: {
          bg: "#0A0A0B", // Near-black background
          surface: "#111113", // Cards, panels
          elevated: "#1A1A1E", // Hover states, modals
          border: "#2A2A30", // Subtle borders
          muted: "#3A3A42", // Disabled, placeholder
          amber: "#F5A623", // Primary accent — warm film amber
          "amber-dim": "#C4841A", // Dimmed accent
          gold: "#E8C97A", // Secondary highlight
          text: "#F0EDE8", // Primary text — warm white
          "text-muted": "#8A8790", // Secondary text
          "text-dim": "#5A5760", // Placeholder, hints
          green: "#4ADE80", // Valid state
          red: "#F87171", // Error state
        },
      },
      fontFamily: {
        // Display font — cinematic, editorial
        display: ["var(--font-display)", "serif"],
        // Body font — clean, readable
        body: ["var(--font-body)", "sans-serif"],
        // Mono — for small labels, codes
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "film-grain":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        shimmer: "shimmer 1.8s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "amber-glow": "0 0 30px rgba(245, 166, 35, 0.15)",
        "amber-glow-sm": "0 0 12px rgba(245, 166, 35, 0.2)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.6)",
      },
    },
  },
  plugins: [],
};
