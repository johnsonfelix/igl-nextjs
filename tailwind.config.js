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
        primary: {
          DEFAULT: "#2ebb79",
          50:  "#f3fbf8",
          100: "#e6f7ef",
          200: "#c8f0dd",
          300: "#9fe6c1",
          400: "#66d598",
          500: "#2ebb79", // same as DEFAULT
          600: "#248f61",
          700: "#1b6b48",
          800: "#134834",
          900: "#0b291a",
        },
        secondary: "#004aad",
        border: "hsl(240, 5%, 84%)",
        card: "#FFFFFF",
        "card-foreground": "#000000",
      },
    },
  },
  plugins: [],
};
