/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9F8F6',
        foreground: '#121212',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['Syne', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '0',
      },
      transitionTimingFunction: {
        'avant-garde': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        'premium-diffused': '0 40px 80px -10px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
