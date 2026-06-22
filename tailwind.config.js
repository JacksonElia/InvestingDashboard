/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#121212',
        surfaceHighlight: '#1e1e1e',
        primary: {
          DEFAULT: '#ff325a',
          dark: '#cc2848',
          light: '#ff5b7b',
        },
        textMain: '#ffffff',
        textMuted: '#a0a0a0',
      }
    },
  },
  plugins: [],
}
