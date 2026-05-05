/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#212121",
        surface: "#2f2f2f",
        sidebar: "#171717",
        border: "#3f3f3f",
        hover: "#2a2a2a",
        accent: "#10A37F",
        "accent-hover": "#0d8f6f",
        muted: "#9b9b9b",
        "user-bubble": "#2f2f2f",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};
