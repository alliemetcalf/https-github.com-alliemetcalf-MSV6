/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0000FF', // Deep blue
          light: '#7FFFD4', // Light aqua
          dark: '#00008B', // Dark blue
        },
        secondary: {
          DEFAULT: '#40E0D0', // Turquoise
          light: '#AFEEEE', // Pale turquoise
          dark: '#008080', // Teal
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
  safelist: [
    'font-sans',
    'font-serif',
    'font-mono',
    'text-sm',
    'text-base',
    'text-lg',
    'text-xl'
  ]
};
