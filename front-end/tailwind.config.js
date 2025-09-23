/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", //include all your source files
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': {
          50: '#f0fff4', 100: '#e0ffe7', 200: '#c0ffc6', 300: '#a0ff9f', 400: '#80ff78',
          500: '#60ff51', 600: '#40d234', 700: '#20a51c', 800: '#0a780e', 900: '#004b08'
        },
        'neon-red': {
          50: '#fff0f0', 100: '#ffe0e0', 200: '#ffc0c0', 300: '#ffa0a0', 400: '#ff8080',
          500: '#ff4d4d', 600: '#e63939', 700: '#cc2626', 800: '#b31313', 900: '#990000'
        },
        'neon-yellow': {
          400: '#ffff00',
          500: '#ffcc00',
        }
      },
      boxShadow: {
        'glow-red': '0 0 10px rgba(255, 77, 77, 0.5), 0 0 20px rgba(255, 77, 77, 0.3)',
        'glow-green': '0 0 10px rgba(96, 255, 81, 0.5), 0 0 20px rgba(96, 255, 81, 0.3)',
      },
    },
  },
  plugins: [],
};