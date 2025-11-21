/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/app/**/*.{js,ts,jsx,tsx}',
      './src/components/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
      extend: {
        colors: {
          neon: 'var(--color-primary)',
          'y2k-pink': 'var(--color-accent)',
          surface: 'var(--color-surface)',
          'surface-soft': 'var(--color-surface-soft)',
          card: 'var(--color-card)',
          border: 'var(--color-border)',
          muted: 'var(--color-muted)',
          foreground: 'var(--color-foreground)',
        },
        fontFamily: {
          pixel: ['"Press Start 2P"', 'cursive'],
          display: ['var(--font-display)', 'cursive'],
          sans: ['var(--font-sans)', 'sans-serif'],
        }
      }
    },
    plugins: []
  }
  
