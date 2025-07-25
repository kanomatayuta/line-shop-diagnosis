/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // iOS Design System Colors
        'ios-blue': '#007AFF',
        'ios-blue-light': '#40A6FF',
        'ios-blue-dark': '#0051D5',
        'ios-green': '#34C759',
        'ios-red': '#FF3B30',
        'ios-orange': '#FF9500',
        'ios-yellow': '#FFCC00',
        'ios-purple': '#AF52DE',
        'ios-pink': '#FF2D92',
        'ios-indigo': '#5856D6',
        'ios-teal': '#5AC8FA',
        'ios-mint': '#00C7BE',
        // System Colors
        'ios-gray': {
          50: '#F2F2F7',
          100: '#E5E5EA',
          200: '#D1D1D6',
          300: '#C7C7CC',
          400: '#AEAEB2',
          500: '#8E8E93',
          600: '#636366',
          700: '#48484A',
          800: '#3A3A3C',
          900: '#2C2C2E',
          950: '#1C1C1E',
        },
      },
      fontFamily: {
        'ios': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ios-large-title': ['34px', { lineHeight: '1.2', fontWeight: '700' }],
        'ios-title-1': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'ios-title-2': ['22px', { lineHeight: '1.3', fontWeight: '700' }],
        'ios-title-3': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'ios-headline': ['17px', { lineHeight: '1.4', fontWeight: '600' }],
        'ios-body': ['17px', { lineHeight: '1.4', fontWeight: '400' }],
        'ios-callout': ['16px', { lineHeight: '1.4', fontWeight: '400' }],
        'ios-subhead': ['15px', { lineHeight: '1.4', fontWeight: '400' }],
        'ios-footnote': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'ios-caption-1': ['12px', { lineHeight: '1.3', fontWeight: '400' }],
        'ios-caption-2': ['11px', { lineHeight: '1.3', fontWeight: '400' }],
      },
      spacing: {
        'ios-xs': '4px',
        'ios-sm': '8px',
        'ios-md': '16px',
        'ios-lg': '24px',
        'ios-xl': '32px',
        'ios-2xl': '48px',
      },
      borderRadius: {
        'ios-xs': '4px',
        'ios-sm': '8px',
        'ios-md': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
        'ios-2xl': '28px',
      },
      boxShadow: {
        'ios-sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'ios-md': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'ios-lg': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'ios-xl': '0 16px 64px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}