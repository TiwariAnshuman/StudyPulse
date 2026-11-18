/** @type {import('tailwindcss').Config} */
// StudyPulse design tokens (SP-UX-04 v1.0). Use these names in className instead of raw hex values.
// Example: bg-canvas, bg-surface, text-ink, text-muted, bg-primary, border-line.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F7F3", // page background
        surface: "#FFFFFF", // cards, forms
        ink: "#202522", // primary text
        muted: "#66716B", // secondary text (5.07:1 on white)
        tint: "#F1F3EF", // quiet neutral fill: hover, tracks, chips (muted text on it is 4.5:1)
        line: {
          DEFAULT: "#DDE2DC", // dividers and card borders
          strong: "#79847E", // form-field edges (3.9:1 on white)
        },
        primary: {
          DEFAULT: "#426B57",
          hover: "#355743",
          subtle: "#E6EEE8",
        },
        attention: {
          DEFAULT: "#D5A14A",
          subtle: "#F6EEDC",
          ink: "#84652D", // text on attention-subtle (4.7:1)
        },
        danger: {
          DEFAULT: "#A84D45",
          subtle: "#F8ECEA",
        },
        // Heatmap intensity ramp, built from the primary green (levels 1 to 4)
        heat: {
          1: "#D6E3DB",
          2: "#A9C4B5",
          3: "#4F7A63",
          4: "#2E4D3D",
        },
      },
      borderColor: { DEFAULT: "#DDE2DC" },
      divideColor: { DEFAULT: "#DDE2DC" },
      borderRadius: {
        control: "6px", // inputs and buttons
        panel: "10px", // cards and panels
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
