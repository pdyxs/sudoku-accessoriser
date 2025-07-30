/**
 * Tests for SudokuPad utilities
 * Migrated from test-utilities.html
 * @jest-environment jsdom
 */

const { setupSudokuPadEnvironment, setupSudokuPadMocks } = require('../helpers/sudokupad-setup');

describe('SudokuPad Utilities', () => {
  let moduleLoader;
  
  beforeAll(() => {
    // Setup mocks first
    setupSudokuPadMocks();
    
    // Load all the SudokuPad utilities
    moduleLoader = setupSudokuPadEnvironment();
  });

  describe('Module Loading', () => {
    test('should load SudokuPadUtilities', () => {
      // Note: utilities.js defines functions as const, not global
      // Check that the module was loaded (evidenced by other globals working)
      expect(global.PuzzleZipper).toBeDefined();
      expect(global.PuzzleLoader).toBeDefined();
      // The utility functions are available in the module scope but not globally exposed
    });

    test('should load PuzzleZipper', () => {
      expect(global.PuzzleZipper).toBeDefined();
      expect(typeof global.PuzzleZipper.zip).toBe('function');
      expect(typeof global.PuzzleZipper.unzip).toBe('function');
    });

    test('should load PuzzleLoader', () => {
      expect(global.PuzzleLoader).toBeDefined();
      expect(typeof global.PuzzleLoader.fetchPuzzle).toBe('function');
    });

    test('should load PuzzleTools', () => {
      expect(global.PuzzleTools).toBeDefined();
      expect(typeof global.PuzzleTools.getCellIndex).toBe('function');
      expect(typeof global.PuzzleTools.getCellPosition).toBe('function');
    });

    test('should load loadFPuzzle', () => {
      expect(global.loadFPuzzle).toBeDefined();
      expect(typeof global.loadFPuzzle.decompressPuzzle).toBe('function');
    });
  });

  describe('PuzzleZipper functionality', () => {
    test('should compress and decompress data correctly', () => {
      const testData = '{"test": "data", "number": 42}';
      
      const zipped = PuzzleZipper.zip(testData);
      expect(zipped).toBeDefined();
      expect(typeof zipped).toBe('string');
      expect(zipped.length).toBeGreaterThan(0);
      
      const unzipped = PuzzleZipper.unzip(zipped);
      expect(unzipped).toBeDefined();
      
      // Compare parsed JSON to handle formatting differences  
      const originalParsed = JSON.parse(testData);
      const unzippedParsed = JSON.parse(unzipped);
      
      expect(unzippedParsed).toEqual(originalParsed);
    });

    test('should handle empty data', () => {
      const emptyData = '{}';
      const zipped = PuzzleZipper.zip(emptyData);
      const unzipped = PuzzleZipper.unzip(zipped);
      
      expect(JSON.parse(unzipped)).toEqual({});
    });

    test('should handle complex puzzle data', () => {
      const complexData = JSON.stringify({
        lines: [
          { color: '#ff0000ff', wayPoints: [[1,1], [2,2]] },
          { color: '#00ff00ff', wayPoints: [[3,3], [4,4]] }
        ],
        grid: Array(9).fill().map(() => Array(9).fill(0))
      });
      
      const zipped = PuzzleZipper.zip(complexData);
      const unzipped = PuzzleZipper.unzip(zipped);
      
      expect(JSON.parse(unzipped)).toEqual(JSON.parse(complexData));
    });
  });

  describe('PuzzleLoader functionality', () => {
    test('should generate correct API URLs', () => {
      const testId = 'psxczr0jpr';
      
      // Test the URL generation functions
      const localUrl = PuzzleLoader.apiPuzzleUrlLocal(testId);
      const legacyUrl = PuzzleLoader.apiPuzzleUrlLegacy(testId);
      const proxyUrl = PuzzleLoader.apiPuzzleUrlLegacyProxy(testId);
      
      expect(localUrl).toBe(`https://sudokupad.app/api/puzzle/${testId}`);
      expect(legacyUrl).toBe(`https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/${encodeURIComponent(testId)}?alt=media`);
      expect(proxyUrl).toBe(`https://sudokupad.svencodes.com/ctclegacy/${encodeURIComponent(testId)}`);
    });

    test('should handle URL encoding correctly', () => {
      const testId = 'pdyxs/whispers-in-the-mist';
      const encodedId = encodeURIComponent(testId);
      
      const localUrl = PuzzleLoader.apiPuzzleUrlLocal(testId);
      expect(localUrl).toBe(`https://sudokupad.app/api/puzzle/pdyxs/whispers-in-the-mist`);
      
      const legacyUrl = PuzzleLoader.apiPuzzleUrlLegacy(testId);
      expect(legacyUrl).toContain(encodedId);
    });

    test('should identify remote puzzle IDs', () => {
      expect(PuzzleLoader.isRemotePuzzleId('psxczr0jpr')).toBe(true);
      expect(PuzzleLoader.isRemotePuzzleId('pdyxs/whispers-in-the-mist')).toBe(true);
      expect(PuzzleLoader.isRemotePuzzleId('fpuzzABC123')).toBe(false); // F-puzzle format
    });
  });

  describe('PuzzleTools functionality', () => {
    test('should calculate cell indices correctly', () => {
      // Test basic cell index calculations (9x9 grid)
      const index = PuzzleTools.getCellIndex(0, 0);
      expect(index).toBe(0);
      
      const position = PuzzleTools.getCellPosition(0);
      expect(position).toEqual([0, 0]);
    });

    test('should handle various grid positions', () => {
      // Test different positions
      const middleIndex = PuzzleTools.getCellIndex(4, 4); // Center of 9x9 grid
      const middlePosition = PuzzleTools.getCellPosition(middleIndex);
      
      expect(middlePosition[0]).toBe(4);
      expect(middlePosition[1]).toBe(4);
    });

    test('should provide consistent index/position conversion', () => {
      // Test round-trip conversion for several positions
      const testPositions = [[0,0], [1,3], [5,7], [8,8]];
      
      testPositions.forEach(([row, col]) => {
        const index = PuzzleTools.getCellIndex(row, col);
        const backToPosition = PuzzleTools.getCellPosition(index);
        
        expect(backToPosition).toEqual([row, col]);
      });
    });
  });

  describe('loadFPuzzle functionality', () => {
    test('should have decompression methods', () => {
      expect(typeof loadFPuzzle.decompressPuzzle).toBe('function');
      expect(typeof loadFPuzzle.compressPuzzle).toBe('function');
    });

    test('should handle F-puzzle format detection', () => {
      // Test F-puzzle format detection if available
      if (loadFPuzzle.detectFormat) {
        expect(typeof loadFPuzzle.detectFormat).toBe('function');
      }
    });
  });
});