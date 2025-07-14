/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB", // Blue-600
        "primary-foreground": "#FFFFFF",
        border: "hsl(240, 5%, 84%)",
        card: "#FFFFFF",
        "card-foreground": "#000000",
      },
    },
  },
  plugins: [],
};
