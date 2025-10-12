import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette bound to CSS variables so we can theme easily
        bg: {
          '0': 'rgb(var(--bg-0) / <alpha-value>)',
          '1': 'rgb(var(--bg-1) / <alpha-value>)',
          '2': 'rgb(var(--bg-2) / <alpha-value>)',
          '3': 'rgb(var(--bg-3) / <alpha-value>)',
          '4': 'rgb(var(--bg-4) / <alpha-value>)',
          '5': 'rgb(var(--bg-5) / <alpha-value>)',
          '6': 'rgb(var(--bg-6) / <alpha-value>)',
          '7': 'rgb(var(--bg-7) / <alpha-value>)',
          '8': 'rgb(var(--bg-8) / <alpha-value>)',
          '9': 'rgb(var(--bg-9) / <alpha-value>)',
          '10': 'rgb(var(--bg-10) / <alpha-value>)',
          '11': 'rgb(var(--bg-11) / <alpha-value>)',
          '12': 'rgb(var(--bg-12) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--fg-default) / <alpha-value>)',
          muted: 'rgb(var(--fg-muted) / <alpha-value>)',
          subtle: 'rgb(var(--fg-subtle) / <alpha-value>)',
        },
        accent: {
          rose: 'rgb(var(--ac-rose) / <alpha-value>)',
          peach: 'rgb(var(--ac-peach) / <alpha-value>)',
          sand: 'rgb(var(--ac-sand) / <alpha-value>)',
          mint: 'rgb(var(--ac-mint) / <alpha-value>)',
          teal: 'rgb(var(--ac-teal) / <alpha-value>)',
          mauve: 'rgb(var(--ac-mauve) / <alpha-value>)',
        },
        grayx: {
          '1': 'rgb(var(--gx-1) / <alpha-value>)',
          '2': 'rgb(var(--gx-2) / <alpha-value>)',
          '3': 'rgb(var(--gx-3) / <alpha-value>)',
        }
      },
      boxShadow: {
        soft: '0 6px 24px rgba(0,0,0,0.25)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem'
      }
    },
  },
  plugins: [],
}

export default config
