// Suppress invalid DOM property 'class' warning for Plotly icons
// This warning comes from react-chart-editor package's SVG icons
const originalWarn = console.warn;

console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: Invalid DOM property `class`. Did you mean `className`?') &&
    (args[0].includes('TraceType') || args[0].includes('PlotlyIconBase'))
  ) {
    // Suppress this specific warning from Plotly icons
    return;
  }
  // Otherwise, call the original warn function
  originalWarn.apply(console, args);
};
