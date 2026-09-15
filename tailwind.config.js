/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.tsx',
    './hooks/**/*.ts',
    './services/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#dcdcdd',
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#e5e4e6',
          muted: '#c5c3c6',
        },
        border: {
          DEFAULT: '#c5c3c6',
          dark: '#a7a5a8',
          subtle: '#dcdcdd',
        },
        charcoal: {
          DEFAULT: '#2f3235',
          dark: '#1e2022',
          light: '#46494c',
        },
        steel: {
          DEFAULT: '#4c5c68',
          dark: '#38444d',
          light: '#627685',
        },
        accent: {
          DEFAULT: '#116c82',
          hover: '#0e5668',
          light: '#e8f4f7',
          dark: '#0a3d4a',
        },
        conflict: {
          DEFAULT: '#78350f',
          light: '#fef3c7',
          dark: '#451a03',
        },
        danger: {
          DEFAULT: '#7f1d1d',
          light: '#fee2e2',
          dark: '#450a0a',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Instrument Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
