/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Quest Canada Brand Colors
        quest: {
          blue: {
            DEFAULT: '#003D7A',
            50: '#E6EBF2',
            100: '#CCD7E5',
            200: '#99AFCB',
            300: '#6687B1',
            400: '#335F97',
            500: '#003D7A',
            600: '#003162',
            700: '#002549',
            800: '#001931',
            900: '#000C18',
          },
          orange: {
            DEFAULT: '#FF6B35',
            50: '#FFF3EE',
            100: '#FFE7DD',
            200: '#FFCFBB',
            300: '#FFB799',
            400: '#FF9F77',
            500: '#FF6B35',
            600: '#E64D1F',
            700: '#B83C18',
            800: '#8A2D12',
            900: '#5C1E0C',
          },
          gray: {
            DEFAULT: '#4A5568',
            50: '#F7FAFC',
            100: '#EDF2F7',
            200: '#E2E8F0',
            300: '#CBD5E0',
            400: '#A0AEC0',
            500: '#4A5568',
            600: '#2D3748',
            700: '#1A202C',
            800: '#171923',
            900: '#0F1419',
          },
        },

        // Override default primary/accent for Quest Canada
        primary: {
          DEFAULT: '#003D7A',
          50: '#E6EBF2',
          100: '#CCD7E5',
          200: '#99AFCB',
          300: '#6687B1',
          400: '#335F97',
          500: '#003D7A',
          600: '#003162',
          700: '#002549',
          800: '#001931',
          900: '#000C18',
        },

        accent: {
          DEFAULT: '#FF6B35',
          50: '#FFF3EE',
          100: '#FFE7DD',
          200: '#FFCFBB',
          300: '#FFB799',
          400: '#FF9F77',
          500: '#FF6B35',
          600: '#E64D1F',
          700: '#B83C18',
          800: '#8A2D12',
          900: '#5C1E0C',
        },

        // Semantic colors
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#92400E',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#991B1B',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#1E40AF',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },

      spacing: {
        '128': '32rem',
        '144': '36rem',
      },

      borderRadius: {
        '4xl': '2rem',
      },

      boxShadow: {
        'quest': '0 4px 14px 0 rgba(0, 61, 122, 0.15)',
        'quest-lg': '0 10px 40px 0 rgba(0, 61, 122, 0.2)',
      },

      backgroundImage: {
        'gradient-quest': 'linear-gradient(135deg, #003D7A 0%, #FF6B35 100%)',
        'gradient-quest-radial': 'radial-gradient(circle at top right, #003D7A 0%, #001931 100%)',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
