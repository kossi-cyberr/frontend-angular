/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: ["class", '[data-theme="stockhub-dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Roboto", "system-ui", "sans-serif"],
      },
      // Identité STOCK-HUB : un bleu-indigo « confiance + commerce », des
      // sémantiques métier claires (stock, alertes, argent).
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce7fd",
          200: "#c0d3fb",
          300: "#94b5f8",
          400: "#618df3",
          500: "#3d67ec",
          600: "#2747e0",
          700: "#1f35ce",
          800: "#202ea7",
          900: "#1f2c84",
          950: "#171d51",
        },
      },
      boxShadow: {
        // Ombres sobres, hiérarchie claire (jamais décoratives)
        "sh-panel": "0 1px 2px rgba(15, 23, 42, 0.06)",
        "sh-pop": "0 4px 12px rgba(15, 23, 42, 0.10), 0 1px 3px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [
    require("daisyui"),
    require("autoprefixer"),
  ],
  daisyui: {
    styled: true,
    themes: [
      {
        // Thème clair STOCK-HUB : surfaces neutres, primaire brand, vert
        // money pour les montants, orange/rouge réservés aux alertes stock.
        "stockhub-light": {
          primary: "#2747e0",
          "primary-content": "#f5f8ff",
          secondary: "#0f766e",
          "secondary-content": "#f0fdfa",
          accent: "#3d67ec",
          "accent-content": "#eef4ff",
          neutral: "#1e293b",
          "neutral-content": "#f1f5f9",
          "base-100": "#ffffff",
          "base-200": "#f6f7f9",
          "base-300": "#e5e8ee",
          "base-content": "#111827",
          info: "#0369a1",
          success: "#15803d",
          warning: "#b45309",
          error: "#dc2626",
        },
      },
      {
        // Thème sombre : ardoise profond, primaire allégé pour le contraste.
        "stockhub-dark": {
          primary: "#618df3",
          "primary-content": "#0f1b45",
          secondary: "#2dd4bf",
          "secondary-content": "#042f2e",
          accent: "#94b5f8",
          "accent-content": "#101a3a",
          neutral: "#334155",
          "neutral-content": "#e2e8f0",
          "base-100": "#0f172a",
          "base-200": "#161f33",
          "base-300": "#243147",
          "base-content": "#e2e8f0",
          info: "#38bdf8",
          success: "#4ade80",
          warning: "#fbbf24",
          error: "#f87171",
        },
      },
    ],
    darkTheme: "stockhub-dark",
    base: true,
    utils: true,
    logs: false,
  },
};
