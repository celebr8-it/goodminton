/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FA', // Light gray-blue
        surface: '#FFFFFF', // Pure white
        primary: '#4169E1', // Royal blue
        'primary-dark': '#3451B2',
        accent: '#4169E1',
        text: '#1E293B', // Dark slate
        muted: '#64748B', // Slate gray
        border: '#E2E8F0', // Light border
        success: '#10B981',
        'success-light': '#D1FAE5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
