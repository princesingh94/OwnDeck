/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        coral: "#ff6b4a",
        sand: "#f6efe8",
        teal: "#0e8f83"
      },
      boxShadow: {
        neon: "0 10px 30px rgba(255, 107, 74, 0.25)"
      }
    }
  },
  plugins: []
};
