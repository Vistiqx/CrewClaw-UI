/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        night: '#0a0a0f',
        'night-light': '#12121a',
        'night-lighter': '#1a1a25',
        lavender: '#e6e6ff',
        'lavender-muted': '#a0a0c0',
        'tropical-indigo': '#7c3aed',
        'ultra-violet': '#4c1d95',
        'amethyst': '#9d4edd',
        'dim-gray': '#6b7280',
        border: '#27272a',
        input: '#27272a',
        ring: '#7c3aed',
        background: '#0a0a0f',
        foreground: '#e6e6ff',
        primary: {
          DEFAULT: '#7c3aed',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#1a1a25',
          foreground: '#e6e6ff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#27272a',
          foreground: '#a0a0c0',
        },
        accent: {
          DEFAULT: '#1a1a25',
          foreground: '#e6e6ff',
        },
        popover: {
          DEFAULT: '#0a0a0f',
          foreground: '#e6e6ff',
        },
        card: {
          DEFAULT: '#12121a',
          foreground: '#e6e6ff',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
