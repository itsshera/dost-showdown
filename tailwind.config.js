/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        sans: ['Rajdhani', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        void: '#05060f',
        panel: '#0b0e1c',
        neon: {
          purple: '#a855f7',
          blue: '#22d3ee',
          pink: '#f472b6',
          lime: '#a3e635',
          amber: '#fbbf24',
        },
      },
      boxShadow: {
        neon: '0 0 24px rgba(168,85,247,.35), 0 0 60px rgba(34,211,238,.12)',
        'neon-strong': '0 0 18px rgba(168,85,247,.65), 0 0 50px rgba(34,211,238,.28)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(rgba(168,85,247,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.08) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
      animation: {
        'float-slow': 'floatSlow 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.6s ease-in-out infinite',
        'scan': 'scan 6s linear infinite',
        'rise': 'rise .5s cubic-bezier(.2,.9,.2,1) both',
        'shake': 'shake .35s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        floatSlow: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '.55' },
          '50%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '10%,90%': { transform: 'translate3d(-2px,0,0)' },
          '20%,80%': { transform: 'translate3d(4px,0,0)' },
          '30%,50%,70%': { transform: 'translate3d(-6px,0,0)' },
          '40%,60%': { transform: 'translate3d(6px,0,0)' },
        },
      },
    },
  },
  plugins: [],
}
