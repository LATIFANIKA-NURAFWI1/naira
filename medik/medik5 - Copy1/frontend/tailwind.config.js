/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand: Green fresh + Warm Cream
        primary: {
          light: '#66BB6A',
          DEFAULT: '#4CAF50',
          dark: '#2E7D32',
        },
        health: '#4CAF50',
        energy: '#2E7D32',
        cream: '#FFFBEA',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
};
