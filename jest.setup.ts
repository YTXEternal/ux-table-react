import '@testing-library/jest-dom';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

// Mock layout properties to make virtualization work in jsdom
Object.defineProperties(HTMLElement.prototype, {
  clientWidth: {
    get() { return 1000; },
    configurable: true,
  },
  clientHeight: {
    get() { return 1000; },
    configurable: true,
  },
  scrollWidth: {
    get() { return 1000; },
    configurable: true,
  },
  scrollHeight: {
    get() { return 1000; },
    configurable: true,
  },
});
