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
          400: '#D4B896',
          500: '#C4A572',
          600: '#A68B5B',
          700: '#8B7355',
          800: '#6F5C45',
          900: '#4A3D2F',
        },
      },
    },
  },
  plugins: [],
};
