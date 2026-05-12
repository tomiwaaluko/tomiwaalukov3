/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '375px', // Extra small screens
      },
      colors: {
        cream: {
          50: '#FFFDF8',
          100: '#FAF6F0',
          200: '#F0E8DC',
          300: '#E3D4C0',
          /* Accent ladder driven by CSS vars — `html.tron-theme` swaps to cyan in `index.css` */
          400: 'rgb(var(--cream-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--cream-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--cream-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--cream-700-rgb) / <alpha-value>)',
          800: '#6F5C45',
          900: '#4A3D2F',
        },
      },
    },
  },
  plugins: [],
};
