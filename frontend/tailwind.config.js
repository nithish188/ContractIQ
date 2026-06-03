/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#05070c',
          900: '#0a0d16',
          850: '#101524',
          800: '#161d30',
          700: '#232d4b',
        },
        brand: {
          purple: '#8b5cf6',
          indigo: '#6366f1',
          teal: '#14b8a6',
        }
      },
    },
  },
  plugins: [],
}
