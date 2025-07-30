// Setup helper for loading SudokuPad utilities in Jest environment

const ModuleLoader = require('./module-loader');

/**
 * Load all SudokuPad utilities in the correct order
 * This mimics the script loading order from index.html
 */
function setupSudokuPadEnvironment() {
  const loader = new ModuleLoader();
  
  // Load modules in the same order as index.html
  const modules = [
    'src/sudokupad/utilities.js',
    'src/sudokupad/puzzlezipper.js', 
    'src/sudokupad/fpuzzlesdecoder.js',
    'src/sudokupad/puzzletools.js',
    'src/sudokupad/puzzleloader.js',
    'src/puzzle-converter.js'
  ];
  
  try {
    loader.loadModules(modules);
    return loader;
  } catch (error) {
    console.error('Failed to setup SudokuPad environment:', error);
    throw error;
  }
}

/**
 * Setup mocks for browser APIs that SudokuPad utilities use
 */
function setupSudokuPadMocks() {
  // Mock FileReader for file operations
  global.FileReader = jest.fn().mockImplementation(() => ({
    readAsText: jest.fn(),
    onload: null,
    onerror: null,
    result: null
  }));

  // Mock document methods used by utilities
  if (!global.document.createElement) {
    global.document.createElement = jest.fn().mockImplementation((tagName) => {
      const element = {
        tagName: tagName.toUpperCase(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        style: {},
        click: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        innerHTML: '',
        textContent: ''
      };
      
      // Special handling for anchor elements
      if (tagName === 'a') {
        element.href = '';
        element.download = '';
      }
      
      return element;
    });
  }

  // Mock document.body.appendChild
  if (!global.document.body) {
    global.document.body = {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    };
  }

  // Enhance fetch mock for SudokuPad API calls
  global.fetch = jest.fn().mockImplementation((url) => {
    // Default mock response
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
      json: () => Promise.resolve({})
    });
  });
}

module.exports = {
  setupSudokuPadEnvironment,
  setupSudokuPadMocks
};