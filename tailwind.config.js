/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#10b981',
          greenDark: '#059669',
          red: '#ef4444',
          redDark: '#dc2626',
        },
        fintech: {
          bg: '#0a0e17',
          card: '#111827',
          cardHover: '#172033',
          border: '#1f293d',
          accent: '#10b981',
          accentGlow: '#059669',
          crimson: '#ef4444',
          crimsonGlow: '#dc2626',
          cyan: '#10b981',
          purple: '#ef4444',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
