/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.tsx",
    "./components/**/*.tsx"
  ],
  theme: {
    extend: {
      colors: {
        accent: "#FC3142",
        infection: "#FED752",
      }
    },
  },
  plugins: [],
}
