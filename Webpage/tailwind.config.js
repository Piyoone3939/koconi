/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#EF6C00",
        secondary: "#64B5F6",
        accent: "#B0BEC5",
        background: "#FFFDE7",
      },
      fontFamily: {
        sans: ["'Noto Sans JP'", "sans-serif"],
      },
    },
  },
  plugins: [],
};