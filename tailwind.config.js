/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,pages,hooks,services}/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
