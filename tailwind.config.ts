import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          '"Instrument Serif"',
          '"Instrument Serif Italic"',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffb',
          300: '#7cc5f7',
          400: '#36a9f1',
          500: '#0c8ee1',
          600: '#0070c0',
          700: '#01599b',
          800: '#064c80',
          900: '#0b406a',
          950: '#07284a',
        },
        drift: {
          pink: '#ffe1ec',
          blue: '#d6e4ff',
          purple: '#e7d8ff',
          mint: '#d3f3e0',
          peach: '#ffe2cf',
          butter: '#fff3c2',
        },
        accent: {
          DEFAULT: '#ff5b8d',
          strong: '#e84783',
          soft: '#ffd0e0',
          ink: '#a8285a',
        },
        ink: {
          DEFAULT: '#1a1a23',
          muted: '#5b5b6b',
          subtle: '#8b8b9a',
          inverse: '#ffffff',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f9fb',
          elevated: '#ffffff',
          dark: '#0a0a0b',
          'dark-secondary': '#121215',
          'dark-elevated': '#18181b',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.55)',
          soft: 'rgba(255, 255, 255, 0.4)',
          strong: 'rgba(255, 255, 255, 0.72)',
          border: 'rgba(255, 255, 255, 0.6)',
          'border-strong': 'rgba(255, 255, 255, 0.85)',
        },
      },
      backdropBlur: {
        glass: '24px',
        'glass-sm': '14px',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        drop: '0 8px 24px 0 rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
        'dark-soft': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        'dark-card': '0 1px 3px 0 rgb(0 0 0 / 0.4)',
        'dark-elevated': '0 4px 12px 0 rgb(0 0 0 / 0.5)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.12), 0 2px 8px 0 rgba(31, 38, 135, 0.06)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.08)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
        'drift-card': '0 1px 1px 0 rgba(17, 24, 39, 0.04), 0 4px 8px 0 rgba(17, 24, 39, 0.04)',
        'drift-card-hover':
          '0 2px 4px 0 rgba(17, 24, 39, 0.04), 0 12px 24px 0 rgba(17, 24, 39, 0.06)',
        'drift-cta':
          '0 6px 20px 0 rgba(255, 91, 141, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.25)',
      },
      borderRadius: {
        glass: '28px',
        'glass-sm': '20px',
        pill: '999px',
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      backgroundImage: {
        'drift-gradient':
          'linear-gradient(135deg, #ffe1ec 0%, #d6e4ff 35%, #e7d8ff 70%, #d3f3e0 100%)',
        'drift-cta': 'linear-gradient(135deg, #ff5b8d 0%, #ff7a5b 50%, #ff9f5b 100%)',
        'glass-sheen':
          'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-out-quint': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'ease-drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'ease-drift': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        drift: 'drift 18s ease-in-out infinite',
        'drift-slow': 'drift 28s ease-in-out infinite',
        'drift-rev': 'driftRev 22s ease-in-out infinite',
        'pulse-bg': 'pulseBg 8s ease-in-out infinite',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up-slow': 'fadeUp 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.06)' },
          '66%': { transform: 'translate(-30px, 25px) scale(0.96)' },
        },
        driftRev: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-30px, 25px) scale(0.96)' },
          '66%': { transform: 'translate(40px, -30px) scale(1.06)' },
        },
        pulseBg: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '0.75' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
