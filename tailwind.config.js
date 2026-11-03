/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#03040a',
          900: '#070914',
          800: '#0d1124',
          700: '#151a33',
        },
        solar: {
          DEFAULT: '#ffb347',
          soft: '#ffd89a',
          deep: '#ff7a1a',
        },
        nebula: {
          DEFAULT: '#7c8cff',
          soft: '#aab4ff',
          cyan: '#5ee7ff',
        },
      },
      fontFamily: {
        display: ['SpaceGrotesk_700Bold'],
        'display-medium': ['SpaceGrotesk_500Medium'],
        body: ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-semibold': ['Inter_600SemiBold'],
      },
    },
  },
  plugins: [],
};
