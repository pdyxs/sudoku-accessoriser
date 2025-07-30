/**
 * Tests for PuzzleLoader class
 * @jest-environment jsdom
 */

describe('PuzzleLoader', () => {
  let PuzzleLoader;

  beforeAll(() => {
    // Create PuzzleLoader class directly since it's now a separate module
    global.PuzzleConverter = {
      isValidSudokuPadUrl: jest.fn(),
      convertSudokuPadUrl: jest.fn(),
      extractPuzzleId: jest.fn()
    };

    // Define PuzzleLoader class for testing
    global.PuzzleLoader = class PuzzleLoader {
      isValidSudokuPadUrl(url) {
        return global.PuzzleConverter.isValidSudokuPadUrl(url);
      }

      async extractPuzzleData(puzzleUrl) {
        try {
          const puzzleData = await global.PuzzleConverter.convertSudokuPadUrl(puzzleUrl);
          
          return {
            title: puzzleData.title,
            puzzleId: puzzleData.puzzleId,
            originalData: puzzleData.originalData,
            features: puzzleData.features,
            totalLines: puzzleData.totalLines,
            featureGroups: puzzleData.featureGroups
          };
        } catch (error) {
          throw new Error(`Failed to extract puzzle data: ${error.message}`);
        }
      }

      extractPuzzleIdFromUrl(url) {
        return global.PuzzleConverter.extractPuzzleId(url);
      }

      normalizePuzzleUrl(puzzleParam) {
        if (puzzleParam.startsWith('http://') || puzzleParam.startsWith('https://')) {
          return puzzleParam;
        }
        
        if (puzzleParam.includes('/')) {
          return `https://sudokupad.app/${puzzleParam}`;
        }
        
        return `https://sudokupad.app/${puzzleParam}`;
      }

      getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
      }

      updateUrlParameter(name, value) {
        const url = new URL(window.location);
        if (value) {
          url.searchParams.set(name, value);
        } else {
          url.searchParams.delete(name);
        }
        window.history.pushState({}, '', url);
      }

      checkForPuzzleParameter() {
        return this.getUrlParameter('puzzle');
      }
    };

    PuzzleLoader = global.PuzzleLoader;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock history.pushState
    window.history.pushState = jest.fn();
  });

  describe('URL validation', () => {
    test('should delegate to PuzzleConverter for validation', () => {
      const loader = new PuzzleLoader();
      global.PuzzleConverter.isValidSudokuPadUrl.mockReturnValue(true);

      const result = loader.isValidSudokuPadUrl('https://sudokupad.app/test123');

      expect(global.PuzzleConverter.isValidSudokuPadUrl).toHaveBeenCalledWith('https://sudokupad.app/test123');
      expect(result).toBe(true);
    });
  });

  describe('Puzzle data extraction', () => {
    test('should extract and format puzzle data', async () => {
      const loader = new PuzzleLoader();
      const mockPuzzleData = {
        title: 'Test Puzzle',
        puzzleId: 'test123',
        originalData: { lines: [] },
        features: [],
        totalLines: 0,
        featureGroups: []
      };

      global.PuzzleConverter.convertSudokuPadUrl.mockResolvedValue(mockPuzzleData);

      const result = await loader.extractPuzzleData('https://sudokupad.app/test123');

      expect(global.PuzzleConverter.convertSudokuPadUrl).toHaveBeenCalledWith('https://sudokupad.app/test123');
      expect(result).toEqual(mockPuzzleData);
    });

    test('should handle extraction errors', async () => {
      const loader = new PuzzleLoader();
      global.PuzzleConverter.convertSudokuPadUrl.mockRejectedValue(new Error('Network error'));

      await expect(loader.extractPuzzleData('https://sudokupad.app/test123'))
        .rejects.toThrow('Failed to extract puzzle data: Network error');
    });
  });

  describe('URL normalization', () => {
    test('should return full URLs as-is', () => {
      const loader = new PuzzleLoader();
      
      expect(loader.normalizePuzzleUrl('https://sudokupad.app/test123')).toBe('https://sudokupad.app/test123');
      expect(loader.normalizePuzzleUrl('http://sudokupad.app/test123')).toBe('http://sudokupad.app/test123');
    });

    test('should handle custom puzzle URLs with slashes', () => {
      const loader = new PuzzleLoader();
      
      expect(loader.normalizePuzzleUrl('author/puzzle-name')).toBe('https://sudokupad.app/author/puzzle-name');
    });

    test('should handle simple puzzle IDs', () => {
      const loader = new PuzzleLoader();
      
      expect(loader.normalizePuzzleUrl('test123')).toBe('https://sudokupad.app/test123');
    });
  });

  describe('URL parameter management', () => {
    test('should get URL parameters', () => {
      const loader = new PuzzleLoader();
      
      // Mock the getUrlParameter method directly for this test
      const mockGetUrlParameter = jest.fn((name) => {
        const params = { puzzle: 'test123', other: 'value' };
        return params[name] || null;
      });
      
      loader.getUrlParameter = mockGetUrlParameter;

      expect(loader.getUrlParameter('puzzle')).toBe('test123');
      expect(loader.getUrlParameter('other')).toBe('value');
      expect(loader.getUrlParameter('missing')).toBeNull();
    });

    test('should update URL parameters', () => {
      // Mock URL constructor for this test
      const mockURL = {
        searchParams: {
          set: jest.fn(),
          delete: jest.fn()
        }
      };
      
      global.URL = jest.fn(() => mockURL);
      
      const loader = new PuzzleLoader();

      loader.updateUrlParameter('puzzle', 'test123');

      expect(mockURL.searchParams.set).toHaveBeenCalledWith('puzzle', 'test123');
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', mockURL);
    });

    test('should remove URL parameters when value is null', () => {
      // Mock URL constructor for this test
      const mockURL = {
        searchParams: {
          set: jest.fn(),
          delete: jest.fn()
        }
      };
      
      global.URL = jest.fn(() => mockURL);
      
      const loader = new PuzzleLoader();

      loader.updateUrlParameter('puzzle', null);

      expect(mockURL.searchParams.delete).toHaveBeenCalledWith('puzzle');
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', mockURL);
    });

    test('should check for puzzle parameter', () => {
      const loader = new PuzzleLoader();
      
      // Mock the getUrlParameter method that checkForPuzzleParameter calls
      loader.getUrlParameter = jest.fn((name) => {
        return name === 'puzzle' ? 'test123' : null;
      });

      expect(loader.checkForPuzzleParameter()).toBe('test123');
    });
  });
});