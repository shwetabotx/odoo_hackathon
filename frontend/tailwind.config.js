/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b1120",
          900: "#0f172a",
          800: "#161f36",
          700: "#212c47",
        },
        brand: {
          50: "#f2f0ff",
          100: "#e6e1ff",
          200: "#c9bdff",
          300: "#a690ff",
          400: "#8563ff",
          500: "#6c3df5",
          600: "#5a2bd8",
          700: "#4820ab",
          800: "#391a85",
          900: "#2c1566",
        },
        mint: {
          400: "#3fd6a0",
          500: "#22b98a",
          600: "#149c73",
        },
        coral: {
          400: "#ff7b6b",
          500: "#f4543f",
          600: "#d63c29",
        },
        sun: {
          400: "#ffc857",
          500: "#f5a623",
        },
        sky: {
          400: "#4fb8e8",
          500: "#2a97cf",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 8px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};
