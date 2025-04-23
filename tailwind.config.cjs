/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
      extend: {
        colors: {
          neon: '#39ff14',
          'y2k-pink': '#ff69b4'
        },
        fontFamily: {
          pixel: ['"Press Start 2P"', 'cursive']
        }
      }
    },
    plugins: []
  }
  