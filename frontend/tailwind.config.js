// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
        ],
      },
      lineHeight: {
        snug: "1.35", // tighter vertical rhythm
      },
      spacing: {
        3.5: "0.875rem", // optional custom spacing between 3 (0.75rem) and 4 (1rem)
      },
    },
  },
  plugins: [],
};
