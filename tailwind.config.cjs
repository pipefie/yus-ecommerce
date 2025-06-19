/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/app/**/*.{js,ts,jsx,tsx}',
      './src/components/**/*.{js,ts,jsx,tsx}'
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
  