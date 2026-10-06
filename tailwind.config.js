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
        background: '#F7F7F8',
        card: '#FFFFFF',
        foreground: '#111111',
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        purple: {
          brand: '#7C3AED',
          hover: '#6D28D9',
          light: '#EDE9FE',
        },
        placeholder: '#EDEDEF',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '24px',
        'image': '20px',
        'chip': '12px',
      },
      boxShadow: {
        'soft': '0 8px 24px rgba(17, 17, 17, 0.06)',
        'soft-sm': '0 4px 16px rgba(17, 17, 17, 0.04)',
        'soft-hover': '0 12px 32px rgba(17, 17, 17, 0.1)',
        'pill': '0 8px 30px rgba(17, 17, 17, 0.08)',
        'purple-glow': '0 12px 30px -5px rgba(124, 58, 237, 0.35)',
      }
    },
  },
  plugins: [],
}
