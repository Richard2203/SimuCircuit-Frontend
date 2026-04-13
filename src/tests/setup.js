import '@testing-library/jest-dom';

// ── Mock de SVG foreignObject ────────────────────────────────────────────────
if (typeof SVGForeignObjectElement === 'undefined') {
  global.SVGForeignObjectElement = class SVGForeignObjectElement extends HTMLElement {};
}

const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Unknown prop') ||
     args[0].includes('SVG') ||
     args[0].includes('foreignObject'))
  ) return;
  originalError(...args);
};
