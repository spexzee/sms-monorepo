import '@testing-library/jest-dom';

// Polyfill ResizeObserver — required by react-data-table-component in jsdom
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub;
