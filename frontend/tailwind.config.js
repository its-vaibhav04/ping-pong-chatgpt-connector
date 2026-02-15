/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1D2A31",
        slate: "#5F7180",
        mist: "#DDE8EA",
        calm: "#6B8C8A"
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 24px rgba(31, 52, 58, 0.12)"
      }
    }
  },
  plugins: []
};
