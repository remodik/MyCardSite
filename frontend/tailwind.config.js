/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        github: {
          dark: '#0d1117',
          darker: '#010409',
          border: '#30363d',
          hover: '#161b22',
          blue: '#58a6ff',
          text: '#c9d1d9',
          textSecondary: '#8b949e',
        },
      },
    },
  },
  plugins: [],
}
