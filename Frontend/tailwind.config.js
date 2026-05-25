/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFA500',
        dark: '#1a1a1a',
        light: '#f5f5f5',
      },
      backgroundImage: {
        'hero-pattern': "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/hero.jpg')",
        'auth-pattern': "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/hero.jpg')",
        'dashboard-pattern': "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/images/hero.jpg')",
      },
    },
  },
  plugins: [],
}
