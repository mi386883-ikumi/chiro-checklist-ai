import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6F0',
        'warm-brown': {
          50: '#FAF6F0',
          100: '#F5ECD9',
          200: '#E8D5B7',
          300: '#D4B896',
          400: '#BF9B75',
          500: '#8B6F47',
          600: '#7A5E3A',
          700: '#6A4E2F',
          800: '#5A3F25',
          900: '#3D2B1F',
        },
        terracotta: {
          50: '#FFF3ED',
          100: '#FFE4D0',
          200: '#FFC5A0',
          300: '#FFA070',
          400: '#F07840',
          500: '#D4855A',
          600: '#C06040',
          700: '#A04830',
        },
        sage: {
          50: '#F0F5F0',
          100: '#D8EAD8',
          200: '#A8CFA8',
          300: '#78B478',
          400: '#5A9A5A',
          500: '#4A8050',
        },
      },
      fontFamily: {
        sans: [
          'Noto Sans JP',
          'Hiragino Kaku Gothic ProN',
          '"Hiragino Sans"',
          'Meiryo',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
export default config
