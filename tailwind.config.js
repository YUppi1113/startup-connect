module.exports = {
  darkMode: 'class',
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#764ba2'
        },
        'dark-bg': '#1f2937',
        'dark-card': '#374151',
        'dark-text': '#d1d5db'
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif']
      }
    }
  },
  plugins: []
};
