/**
 * FERRETODO — Preset de Tailwind con los tokens del Design System.
 * Documentación: docs/05-DESIGN-SYSTEM.md
 * Los colores se exponen como CSS variables (definidas en packages/ui/src/tokens.css)
 * para soportar modo claro/oscuro sin recompilar.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
        },
        bg: "var(--bg)",
        surface: "var(--surface)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        border: "var(--border)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
        sale: "var(--sale)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15,23,42,.06)",
        md: "0 4px 12px rgba(15,23,42,.08)",
        lg: "0 12px 32px rgba(15,23,42,.12)",
        brand: "0 8px 24px rgba(242,92,5,.25)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
