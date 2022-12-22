/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme')

const config = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  mode: 'jit',
  theme: {
    extend: {
      fontFamily: {
        roboto: ['Roboto', ...defaultTheme.fontFamily.sans],
      },
      dropShadow: {
        landinglogo: ['0 0 4px rgb(255 255 255 / 0.5)'],
        footeritem: ['0 1px 0 rgb(255 255 255 / 0.5)'],
        loader: ['0 0 2px rgb(255 255 255 / 1)'],
      },
    },
  },
  plugins: [],
}

module.exports = config
