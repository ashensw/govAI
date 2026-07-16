/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef2f7",
          100: "#d4dfec",
          200: "#a9bfd9",
          300: "#7e9fc6",
          400: "#537fb3",
          500: "#365f92",
          600: "#284872",
          700: "#1d3557",
          800: "#152740",
          900: "#0d1a2b",
          950: "#080f1a",
        },
        gold: {
          50: "#fdf8ec",
          100: "#faedc9",
          200: "#f5db93",
          300: "#f0c85d",
          400: "#ecb833",
          500: "#d69f1f",
          600: "#b17f18",
          700: "#8a6116",
          800: "#6d4c16",
          900: "#5a3f16",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(13, 26, 43, 0.08), 0 1px 2px -1px rgba(13, 26, 43, 0.08)",
      },
    },
  },
  plugins: [],
};
