/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bharat': {
          primary: '#1e293b',    // Slate
          success: '#065f46',    // Emerald
          negotiation: '#92400e', // Amber
          background: '#f8fafc',
          surface: '#ffffff',
          muted: '#64748b',
          border: '#e2e8f0'
        }
      },
      fontFamily: {
        'sans': ['Inter', 'Roboto', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}