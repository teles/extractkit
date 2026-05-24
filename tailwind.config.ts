import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./sidepanel.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      colors: {
        ink: {
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#DADCE0',
          300: '#C4C7C5',
          400: '#9AA0A6',
          500: '#5F6368',
          700: '#3C4043',
          800: '#2F3336',
          900: '#202124',
          950: '#171717',
          975: '#111111'
        },
        brand: {
          50: '#E8F0FE',
          100: '#D2E3FC',
          200: '#AECBFA',
          400: '#669DF6',
          500: '#1A73E8',
          600: '#1A73E8',
          700: '#1558B0'
        },
        violetline: {
          500: '#5F6368',
          600: '#3C4043'
        },
        success: {
          50: '#E6F4EA',
          500: '#188038'
        },
        amberline: {
          50: '#FEF7E0',
          100: '#FDE293',
          500: '#F9AB00'
        },
        coral: {
          50: '#FCE8E6',
          100: '#FAD2CF',
          500: '#D93025'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
