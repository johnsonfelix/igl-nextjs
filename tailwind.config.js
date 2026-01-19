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
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        alt: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#2ebb79",
          50: "#f3fbf8",
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
        // Custom colors from style.css
        blue: "#004aad",
        iglagreen: "#ceeba3",
        base: "#2946f3",
        red: "#dc3131",
        "light-red": "#feedec",
        "crusoe-green": "#d39121",
        yellow: "#ffea23",
        "dark-gray": "#232323",
        "medium-gray": "#717580",
        "extra-medium-gray": "#e4e4e4",
        "light-gray": "#a8a8a8",
        "very-light-gray": "#f7f7f7",
        "light-medium-gray": "#eaeaeb",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [],
};
