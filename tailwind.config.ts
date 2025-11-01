import containerQueries from '@tailwindcss/container-queries';
import typography from '@tailwindcss/typography';
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
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-cairo)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
        english: ['var(--font-inter)', 'system-ui', 'sans-serif'],
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
      },
    },
  },
  plugins: [
    // Enables component-level responsiveness using CSS Container Queries.
    containerQueries,
    // Provides beautiful default styles for blog content.
    typography,
  ],
};

export default config;
