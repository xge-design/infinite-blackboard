/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Chalkboard palette
        chalk: {
          white: '#e8e4d9',
          cream: '#f5f0e1',
          gray: '#b8b4a8',
        },
        board: {
          dark: '#1a1a1a',
          DEFAULT: '#2a2a2a',
          light: '#3a3a3a',
          edge: '#151515',
        },
      },
      fontFamily: {
        chalk: ['"Caveat"', 'cursive'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
