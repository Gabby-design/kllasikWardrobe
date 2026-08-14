/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9F8F6',
        foreground: '#121212',
        obsidian: '#0A0A0C',
        'obsidian-card': '#111111',
        'gold-accent': '#D4AF37',
        'gold-light': '#FDF6E2',
        'neutral-subtle': '#F2EFEB',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['Syne', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px',
      },
      transitionTimingFunction: {
        'avant-garde': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        'premium-diffused': '0 40px 80px -10px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
        'dark-glow': '0 20px 50px -10px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
