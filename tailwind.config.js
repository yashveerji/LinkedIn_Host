/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1A1F71',
          dark: '#23243a',
        },
        accent: {
          DEFAULT: '#FFD700',
          light: '#FFEB80',
        },
        card: '#23243a',
        border: '#FFD700',
      },
    },
  },
  plugins: [],
}

