import containerQueries from '@tailwindcss/container-queries';
import typography from '@tailwindcss/typography';
import tailwindScrollbar from 'tailwind-scrollbar';
import plugin from 'tailwindcss/plugin';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aqua: {
          50: '#f1fbfd',
          100: '#d4f1f7',
          200: '#a9e3ee',
          300: '#76cfe0',
          400: '#45b7cf',
          500: '#0e8fa8',
          600: '#0b7289',
          700: '#095a6c',
          800: '#064252',
          900: '#042c39',
          950: '#021a24',
        },
        sand: {
          50: '#f9f4ec',
          100: '#f0e4d2',
          200: '#dfc9a8',
          300: '#cdaa7d',
          400: '#bd915b',
          500: '#b89968',
          600: '#967952',
          700: '#745c3d',
          800: '#54422b',
          900: '#35291a',
          950: '#1f170f',
        },
        coral: {
          50: '#fff2f0',
          100: '#ffe1dd',
          200: '#ffbfb5',
          300: '#ff998b',
          400: '#ff7a6b',
          500: '#ff6f61',
          600: '#e45949',
          700: '#bf4639',
          800: '#99352c',
          900: '#73251f',
          950: '#4d170f',
        },
        ocean: {
          50: '#f0f9fb',
          100: '#def3f6',
          200: '#b6e4ed',
          300: '#7fcdff',
          400: '#76b6c4',
          500: '#1da2d8',
          600: '#0e8fa8',
          700: '#0b7289',
          800: '#064273',
          900: '#042c39',
          950: '#021a24',
        },
        gold: {
          50: '#fef9f0',
          100: '#fdf3e0',
          200: '#fbe7c1',
          300: '#f9dba2',
          400: '#e5c882',
          500: '#c2964b',
          600: '#a67d3e',
          700: '#8a6432',
          800: '#6e4b26',
          900: '#52321a',
          950: '#36190e',
        },
        mocha: {
          50: '#f9f5f2',
          100: '#f0e8e1',
          200: '#e1d1c3',
          300: '#d2baa5',
          400: '#c3a387',
          500: '#a47764',
          600: '#8a6353',
          700: '#704f42',
          800: '#563b31',
          900: '#3c2720',
          950: '#221310',
        },
        neon: {
          blue: '#00D9FF',
          purple: '#9B5CFF',
          pink: '#FF4DFF',
          green: '#39FF14',
          yellow: '#F5FF70',
          orange: '#FF9E00',
        },
        pastel: {
          blue: '#CFE9FF',
          pink: '#FFD1DC',
          mint: '#DFF4EC',
          lilac: '#E7DFFF',
          peach: '#FFE5C4',
          yellow: '#FFF7D6',
        },
        'neon-blue': '#00D9FF',
        'pure-black': '#000000',
        'pure-white': '#FFFFFF',
        'sky-pastel': '#E3F2FD',
        'mint-pastel': '#E0F2F1',
        'beige-pastel': '#FFF8E1',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
        'ocean-gradient-start': 'rgb(var(--ocean-gradient-start) / <alpha-value>)',
        'ocean-gradient-mid': 'rgb(var(--ocean-gradient-mid) / <alpha-value>)',
        'ocean-gradient-end': 'rgb(var(--ocean-gradient-end) / <alpha-value>)',
        'sunset-gradient-start': 'rgb(var(--sunset-gradient-start) / <alpha-value>)',
        'sunset-gradient-mid': 'rgb(var(--sunset-gradient-mid) / <alpha-value>)',
        'sunset-gradient-end': 'rgb(var(--sunset-gradient-end) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
        english: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        heading: ['var(--font-cairo)', 'var(--font-montserrat)', 'var(--font-inter)', 'sans-serif'],
        body: ['var(--font-cairo)', 'var(--font-raleway)', 'var(--font-inter)', 'sans-serif'],
        'arabic-display': ['var(--font-noto-arabic)', 'var(--font-cairo)', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none: 'none',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'accordion-down': 'accordionDown 0.2s ease-out',
        'accordion-up': 'accordionUp 0.2s ease-out',
        'gauge-container': 'gaugeContainer 0.4s ease-out',
        'gauge-needle': 'gaugeNeedle 0.8s ease-out forwards',
        'gauge-arc': 'gaugeArc 0.8s ease-out forwards',
        'progress-fill': 'progressFill 0.6s ease-out forwards',
        'wave-scroll': 'wave-scroll 10s ease-in-out infinite',
        'bubble-rise': 'bubble-rise 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        'fish-swim': 'fish-swim 4s ease-in-out infinite',
        'luxury-fade': 'luxury-fade 0.8s ease forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        accordionDown: {
          from: { height: '0', opacity: '0' },
          to: { height: 'var(--accordion-content-height)', opacity: '1' },
        },
        accordionUp: {
          from: { height: 'var(--accordion-content-height)', opacity: '1' },
          to: { height: '0', opacity: '0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        gaugeContainer: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        gaugeNeedle: {
          from: { transform: 'rotate(-90deg)' },
          to: { transform: 'rotate(var(--gauge-needle-angle))' },
        },
        gaugeArc: {
          from: { strokeDashoffset: 'var(--gauge-arc-circumference)' },
          to: { strokeDashoffset: 'var(--gauge-arc-target)' },
        },
        progressFill: {
          from: { width: '0%' },
          to: { width: 'var(--progress-target, 100%)' },
        },
        'wave-scroll': {
          '0%': { transform: 'translateY(12px)', opacity: '0.85' },
          '50%': { transform: 'translateY(-12px)', opacity: '1' },
          '100%': { transform: 'translateY(12px)', opacity: '0.85' },
        },
        'bubble-rise': {
          '0%': { transform: 'translateY(12px) scale(0.85)', opacity: '0' },
          '50%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-80px) scale(1.05)', opacity: '0' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow:
              '0 0 18px rgba(0, 217, 255, 0.35), 0 0 36px rgba(0, 217, 255, 0.18)',
          },
          '50%': {
            boxShadow:
              '0 0 26px rgba(0, 217, 255, 0.5), 0 0 48px rgba(0, 217, 255, 0.28)',
          },
        },
        'fish-swim': {
          '0%': { transform: 'translateX(-10px) translateY(0)' },
          '50%': { transform: 'translateX(10px) translateY(-6px)' },
          '100%': { transform: 'translateX(-10px) translateY(0)' },
        },
        'luxury-fade': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'ocean-gradient':
          'linear-gradient(135deg, rgb(var(--ocean-gradient-start)) 0%, rgb(var(--ocean-gradient-mid)) 50%, rgb(var(--ocean-gradient-end)) 100%)',
        'ocean-gradient-vertical':
          'linear-gradient(180deg, rgb(var(--ocean-gradient-start)) 0%, rgb(var(--ocean-gradient-mid)) 50%, rgb(var(--ocean-gradient-end)) 100%)',
        'sunset-gradient':
          'linear-gradient(135deg, rgb(var(--sunset-gradient-start)) 0%, rgb(var(--sunset-gradient-mid)) 50%, rgb(var(--sunset-gradient-end)) 100%)',
        'sunset-gradient-vertical':
          'linear-gradient(180deg, rgb(var(--sunset-gradient-start)) 0%, rgb(var(--sunset-gradient-mid)) 50%, rgb(var(--sunset-gradient-end)) 100%)',
        shimmer:
          'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
      },
      backdropBlur: {
        heavy: '24px',
      },
    },
  },
  plugins: [
    // Enables component-level responsiveness using CSS Container Queries.
    containerQueries,
    // Provides beautiful default styles for blog content.
    typography,
    // Adds custom scrollbar styling
    tailwindScrollbar,
    // Custom utilities
    plugin(({ addUtilities }) => {
      addUtilities({
        '.text-shadow-glow': {
          textShadow:
            '0 0 14px rgba(0, 217, 255, 0.35), 0 0 28px rgba(0, 217, 255, 0.2)',
        },
      });
    }),
  ],
};

export default config;
