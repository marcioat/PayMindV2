const defaultTheme = require("tailwindcss/defaultTheme");

const scaleFactor = 0.5;

function scaleRem(value, factor = scaleFactor) {
  if (typeof value === "string" && value.endsWith("rem")) {
    return `${parseFloat(value) * factor}rem`;
  }
  return value;
}

function scaleSpacing(spacing) {
  return Object.fromEntries(
    Object.entries(spacing).map(([k, v]) => [k, scaleRem(v)]),
  );
}

function scaleFontSize(fontSize) {
  return Object.fromEntries(
    Object.entries(fontSize).map(([k, v]) => {
      if (Array.isArray(v)) {
        const [size, opts] = v;
        return [k, [scaleRem(size), opts]];
      }
      return [k, v];
    }),
  );
}

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    spacing: scaleSpacing(defaultTheme.spacing),
    fontSize: scaleFontSize(defaultTheme.fontSize),
    extend: {},
  },
  plugins: [],
};
