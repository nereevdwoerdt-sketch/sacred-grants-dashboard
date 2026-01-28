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
        // Sacred Taste brand colors
        sacred: {
          brown: '#312117',      // Primary deep brown
          cream: '#F5F3E6',      // Background cream/beige
          gold: '#D39D33',       // Accent gold
          green: '#11472C',      // Dark green
          50: '#faf9f5',
          100: '#f5f3e6',        // Same as cream
          200: '#e8e4d1',
          300: '#d4cdb3',
          400: '#beb28f',
          500: '#a99a6f',
          600: '#958559',
          700: '#7a6c4a',
          800: '#655940',
          900: '#544a37',
          950: '#312117',        // Same as brown
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
        sans: ['Nunito Sans', 'system-ui', 'sans-serif'],
        serif: ['Quincy', 'Georgia', 'serif'],
      },
      borderRadius: {
        'sacred': '1rem',
        'sacred-lg': '2rem',
        'sacred-xl': '5rem',
      },
    },
  },
  plugins: [],
}
