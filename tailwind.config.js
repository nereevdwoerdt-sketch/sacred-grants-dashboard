/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sacred: {
          50: '#fdf8f3',
          100: '#f9ebe0',
          200: '#f2d5bc',
          300: '#e8b78f',
          400: '#dd925d',
          500: '#d4753d',
          600: '#c55f32',
          700: '#a4492b',
          800: '#843c29',
          900: '#6b3324',
          950: '#3a1811',
        },
        earth: {
          50: '#f6f5f0',
          100: '#e8e6d9',
          200: '#d3cfb6',
          300: '#b9b28c',
          400: '#a49a6c',
          500: '#958a5d',
          600: '#80724e',
          700: '#675a41',
          800: '#574b39',
          900: '#4b4134',
          950: '#2a231b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
