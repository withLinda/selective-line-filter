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
          0: 'var(--bg-0)', 1: 'var(--bg-1)', 2: 'var(--bg-2)', 3: 'var(--bg-3)',
          4: 'var(--bg-4)', 5: 'var(--bg-5)', 6: 'var(--bg-6)', 7: 'var(--bg-7)',
          8: 'var(--bg-8)', 9: 'var(--bg-9)', 10: 'var(--bg-10)', 11: 'var(--bg-11)', 12: 'var(--bg-12)'
        },
        fg: {
          DEFAULT: 'var(--fg-default)',
          muted: 'var(--fg-muted)',
          subtle: 'var(--fg-subtle)'
        },
        accent: {
          rose: 'var(--ac-rose)',
          peach: 'var(--ac-peach)',
          sand: 'var(--ac-sand)',
          mint: 'var(--ac-mint)',
          teal: 'var(--ac-teal)',
          mauve: 'var(--ac-mauve)'
        },
        grayx: {
          1: 'var(--gx-1)',
          2: 'var(--gx-2)',
          3: 'var(--gx-3)'
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
