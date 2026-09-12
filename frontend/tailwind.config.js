/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hpl: {
          bg: '#070B14',
          surface: '#0E1626',
          card: '#121D33',
          cardHover: '#182642',
          border: '#1E2F4D',
          borderHighlight: '#2A436B',
          cyan: {
            DEFAULT: '#22D3EE',
            dim: 'rgba(34, 211, 238, 0.15)',
            glow: 'rgba(34, 211, 238, 0.4)',
            dark: '#0891B2',
          },
          gold: {
            DEFAULT: '#F5B942',
            light: '#FDE047',
            dim: 'rgba(245, 185, 66, 0.15)',
            glow: 'rgba(245, 185, 66, 0.45)',
          },
          red: {
            DEFAULT: '#EF4444',
            dim: 'rgba(239, 68, 68, 0.15)',
            glow: 'rgba(239, 68, 68, 0.4)',
          },
          green: {
            DEFAULT: '#10B981',
            dim: 'rgba(16, 185, 129, 0.15)',
          },
          text: {
            primary: '#F8FAFC',
            secondary: '#94A3B8',
            muted: '#64748B',
          },
        },
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        hud: '0 0 20px rgba(34, 211, 238, 0.15), inset 0 0 15px rgba(34, 211, 238, 0.05)',
        goldGlow: '0 0 25px rgba(245, 185, 66, 0.35)',
        cyanGlow: '0 0 25px rgba(34, 211, 238, 0.35)',
        redGlow: '0 0 25px rgba(239, 68, 68, 0.35)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticker-pop': 'pop 0.3s ease-out forwards',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
