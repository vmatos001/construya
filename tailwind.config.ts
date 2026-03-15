import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EBF3FB',
          100: '#B5D4F4',
          500: '#378ADD',
          700: '#185FA5',
          900: '#042C53',
        },
        accent: {
          400: '#E07B39',
          600: '#B85E20',
        }
      }
    }
  },
  plugins: []
}
export default config
