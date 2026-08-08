import '@testing-library/jest-dom';
import { Canvas } from 'canvas';

// Polyfill HTMLCanvasElement.getContext for jsdom
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, options?: any) {
  if (contextId === '2d') {
    const canvas = new Canvas(this.width || 300, this.height || 150);
    return canvas.getContext('2d', options);
  }
  return null;
} as any;

// Also ensure canvas.toDataURL works
HTMLCanvasElement.prototype.toDataURL = function (this: HTMLCanvasElement) {
  const canvas = new Canvas(this.width || 300, this.height || 150);
  return canvas.toDataURL();
};

// Mock getBoundingClientRect for canvas elements to return a proper size in tests
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function (this: Element) {
  const rect = originalGetBoundingClientRect.call(this);
  // If it's a canvas element, always return a proper size
  if (this.tagName === 'CANVAS') {
    return {
      ...rect,
      width: 800,
      height: 600,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
    };
  }
  return rect;
};

// Mock devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 1,
  writable: true,
});
