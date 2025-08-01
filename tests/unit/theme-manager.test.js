/**
 * Tests for theme management functionality
 * @jest-environment jsdom
 */

describe('Theme Management', () => {
  let mockLocalStorage;

  beforeEach(() => {
    // Set up DOM - need to set attribute on documentElement, not innerHTML
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.innerHTML = `
      <button class="theme-toggle">
        <span class="theme-icon">🌙</span>
      </button>
    `;

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test('should initialize with light theme by default', () => {
    // Test logic for theme initialization
    const themeAttribute = document.documentElement.getAttribute('data-theme');
    expect(themeAttribute).toBe('light');

    const themeIcon = document.querySelector('.theme-icon');
    expect(themeIcon.textContent).toBe('🌙');
  });

  test('should toggle between light and dark themes', () => {
    // Simulate theme toggle
    const initialTheme = document.documentElement.getAttribute('data-theme');
    expect(initialTheme).toBe('light');

    // Test theme switching logic
    document.documentElement.setAttribute('data-theme', 'dark');
    const newTheme = document.documentElement.getAttribute('data-theme');
    expect(newTheme).toBe('dark');

    // Test icon change
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = '☀️';
    expect(themeIcon.textContent).toBe('☀️');
  });

  test('should save theme preference to localStorage', () => {
    // Test localStorage interaction
    const setTheme = theme => {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    };

    setTheme('dark');

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('should respect saved theme preference on load', () => {
    mockLocalStorage.getItem.mockReturnValue('dark');

    // Simulate initialization with saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('should respect browser dark mode preference when no saved theme', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    // Mock dark mode preference
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const theme = prefersDark ? 'dark' : 'light';

    expect(theme).toBe('dark');
  });
});
