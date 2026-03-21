/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { 900: '#0a0e1a', 800: '#0d1224', 700: '#111827', 600: '#1a2235', 500: '#1e2a40' },
        neon:  { green: '#00ff87', blue: '#00d4ff', purple: '#bf5af2', yellow: '#ffd60a', orange: '#ff6b35' },
        glass: { DEFAULT: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'glow-green':  'glowGreen 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 },                    to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glowGreen:  { '0%,100%': { boxShadow: '0 0 8px #00ff8740' }, '50%': { boxShadow: '0 0 20px #00ff8780' } },
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        active: '0 0 0 2px #00ff8760',
        neon:   '0 0 20px rgba(0,255,135,0.3)',
      },
    },
  },
  plugins: [],
};
