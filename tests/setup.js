// Jest setup file - runs before each test file

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock URLSearchParams for query parameter handling
global.URLSearchParams = jest.fn().mockImplementation((search) => ({
  get: jest.fn().mockReturnValue(null),
  set: jest.fn(),
  delete: jest.fn(),
  toString: jest.fn().mockReturnValue('')
}));

// Mock window.history
window.history = {
  pushState: jest.fn(),
  replaceState: jest.fn(),
  back: jest.fn(),
  forward: jest.fn()
};

// Mock console.log for cleaner test output (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
});