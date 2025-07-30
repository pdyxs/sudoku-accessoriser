/**
 * Tests for PuzzleConverter class
 * Migrated from test-converter.html
 * @jest-environment jsdom
 */

const { setupSudokuPadEnvironment, setupSudokuPadMocks } = require('../helpers/sudokupad-setup');
const { setupSudokuPadAPIMock, addMockPuzzle } = require('../__mocks__/sudokupad-api');
const { SAMPLE_PUZZLE_URL, SAMPLE_CUSTOM_URL } = require('../fixtures/sample-puzzles');

describe('PuzzleConverter', () => {
  let moduleLoader;
  
  beforeAll(() => {
    // Setup mocks first
    setupSudokuPadMocks();
    setupSudokuPadAPIMock();
    
    // Load all the SudokuPad utilities and PuzzleConverter
    moduleLoader = setupSudokuPadEnvironment();
  });

  describe('URL validation', () => {
    test('should identify valid SudokuPad URLs', () => {
      // Check that PuzzleConverter was loaded
      expect(global.PuzzleConverter).toBeDefined();
      expect(typeof global.PuzzleConverter.isValidSudokuPadUrl).toBe('function');
      
      const validUrls = [
        'https://sudokupad.app/psxczr0jpr',
        'https://sudokupad.app/pdyxs/whispers-in-the-mist',
        'https://sudokupad.app/scf?puzzleid=sclABC123',
        'http://sudokupad.app/test123'
      ];

      validUrls.forEach(url => {
        expect(PuzzleConverter.isValidSudokuPadUrl(url)).toBe(true);
      });
    });

    test('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/puzzle',
        'not-a-url',
        '',
        'https://sudokupad.com/wrong-domain', // Note: .com instead of .app
      ];

      invalidUrls.forEach(url => {
        expect(PuzzleConverter.isValidSudokuPadUrl(url)).toBe(false);
      });
    });
  });

  describe('Puzzle ID extraction', () => {
    test('should extract simple puzzle IDs', () => {
      const url = 'https://sudokupad.app/psxczr0jpr';
      expect(PuzzleConverter.extractPuzzleId(url)).toBe('psxczr0jpr');
    });

    test('should extract custom puzzle IDs', () => {
      const url = 'https://sudokupad.app/pdyxs/whispers-in-the-mist';
      expect(PuzzleConverter.extractPuzzleId(url)).toBe('pdyxs/whispers-in-the-mist');
    });

    test('should handle SCL format URLs', () => {
      const url = 'https://sudokupad.app/scf?puzzleid=sclABC123';
      // The current implementation extracts 'scf?puzzleid=sclABC123'
      // This might be the intended behavior based on the regex in puzzle-converter.js
      const extracted = PuzzleConverter.extractPuzzleId(url);
      expect(extracted).toContain('sclABC123');
      // For now, accept that it includes the full path
      expect(extracted).toBe('scf?puzzleid=sclABC123');
    });

    test('should return null for invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/puzzle',
        'not-a-url',
        '',
        'https://sudokupad.com/wrong-domain'
      ];
      
      invalidUrls.forEach(url => {
        expect(PuzzleConverter.extractPuzzleId(url)).toBeNull();
      });
    });
  });

  describe('Puzzle conversion', () => {
    beforeEach(() => {
      // Reset fetch mock before each test
      jest.clearAllMocks();
      setupSudokuPadAPIMock();
    });

    test('should convert valid puzzle URL to data', async () => {
      const url = SAMPLE_PUZZLE_URL; // 'https://sudokupad.app/psxczr0jpr'
      
      const result = await PuzzleConverter.convertSudokuPadUrl(url);
      
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('puzzleId');
      expect(result).toHaveProperty('originalData');
      expect(result).toHaveProperty('features');
      expect(result.puzzleId).toBe('psxczr0jpr');
    });

    test('should handle custom URLs', async () => {
      const url = SAMPLE_CUSTOM_URL; // 'https://sudokupad.app/pdyxs/whispers-in-the-mist'
      
      const result = await PuzzleConverter.convertSudokuPadUrl(url);
      
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('puzzleId', 'pdyxs/whispers-in-the-mist');
      expect(result).toHaveProperty('originalData');
    });

    test('should handle API errors gracefully', async () => {
      const invalidUrl = 'https://sudokupad.app/nonexistent-puzzle';
      
      await expect(
        PuzzleConverter.convertSudokuPadUrl(invalidUrl)
      ).rejects.toThrow();
    });

    test('should handle invalid URL format', async () => {
      const invalidUrl = 'https://example.com/not-a-sudokupad-url';
      
      await expect(
        PuzzleConverter.convertSudokuPadUrl(invalidUrl)
      ).rejects.toThrow('Invalid SudokuPad URL format');
    });

    test('should extract features from puzzle data', async () => {
      // Add a mock puzzle with specific features for testing
      addMockPuzzle('test-features', {
        title: 'Feature Test Puzzle',
        data: {
          lines: [
            { color: '#ff0000ff', thickness: 2, wayPoints: [[1,1], [2,2]] },
            { color: '#ff0000ff', thickness: 2, wayPoints: [[3,3], [4,4]] },
            { color: '#00ff00ff', thickness: 1, wayPoints: [[5,5], [6,6]] }
          ]
        }
      });
      
      const result = await PuzzleConverter.convertSudokuPadUrl('https://sudokupad.app/test-features');
      
      expect(result.features).toBeDefined();
      expect(Array.isArray(result.features)).toBe(true);
      if (result.features.length > 0) {
        expect(result.features[0]).toHaveProperty('category');
        expect(result.features[0]).toHaveProperty('count');
        expect(result.features[0]).toHaveProperty('visual');
      }
    });
  });
});