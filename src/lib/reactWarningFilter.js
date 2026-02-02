// Suppress invalid DOM property 'class' warning for Plotly icons
// This warning comes from react-chart-editor package's SVG icons
const originalWarn = console.warn;
const originalError = console.error;

// Handle console.warn
console.warn = (...args) => {
  // Check if this is the invalid DOM property warning
  const isInvalidClassWarning = args.some(arg => {
    if (typeof arg === 'string') {
      return arg.includes('Invalid DOM property `class`') || arg.includes('Did you mean `className`?');
    }
    return false;
  });
  
  if (isInvalidClassWarning) {
    // Suppress this specific warning
    return;
  }
  
  // Otherwise, call the original warn function
  originalWarn.apply(console, args);
};

// Also handle console.error in case React uses it for warnings
console.error = (...args) => {
  // Check if this is the invalid DOM property warning
  const isInvalidClassWarning = args.some(arg => {
    if (typeof arg === 'string') {
      return arg.includes('Invalid DOM property `class`') || arg.includes('Did you mean `className`?');
    }
    return false;
  });
  
  if (isInvalidClassWarning) {
    // Suppress this specific warning
    return;
  }
  
  // Otherwise, call the original error function
  originalError.apply(console, args);
};
