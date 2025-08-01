/**
 * Tests for PuzzleManager error handling and retry functionality
 * @jest-environment jsdom
 */

// Mock PuzzleConverter
global.PuzzleConverter = {
  isValidSudokuPadUrl: jest.fn(),
  convertSudokuPadUrl: jest.fn(),
  extractPuzzleId: jest.fn(),
};

describe('PuzzleManager Error Handling', () => {
  let PuzzleManager;
  let puzzleManager;

  beforeAll(() => {
    // Define PuzzleManager class for testing (simplified version focused on error handling)
    global.PuzzleManager = class PuzzleManager {
      constructor() {
        this.maxRetries = 3;
        this.baseDelay = 1000;
        this.maxDelay = 5000;
      }

      classifyError(error) {
        const message = error.message.toLowerCase();

        if (message.includes('network') || message.includes('fetch')) {
          return 'network';
        } else if (message.includes('timeout')) {
          return 'timeout';
        } else if (message.includes('404') || message.includes('not found')) {
          return 'not_found';
        } else if (message.includes('403') || message.includes('forbidden')) {
          return 'forbidden';
        } else if (
          message.includes('500') ||
          message.includes('server error')
        ) {
          return 'server_error';
        } else if (message.includes('parse') || message.includes('json')) {
          return 'parse_error';
        }

        return 'unknown';
      }

      isRetryableError(errorType) {
        const retryableTypes = ['network', 'timeout', 'server_error'];
        return retryableTypes.includes(errorType);
      }

      createUserFriendlyError(originalError, errorType) {
        const messages = {
          network:
            'Network connection failed. Please check your internet connection and try again.',
          timeout:
            'Request timed out. The puzzle server may be slow to respond. Please try again.',
          not_found:
            'Puzzle not found. Please check that the URL is correct and the puzzle exists.',
          forbidden:
            'Access denied. This puzzle may be private or the URL may be incorrect.',
          server_error:
            'SudokuPad server error. Please try again in a few moments.',
          parse_error:
            'Unable to parse puzzle data. The puzzle format may not be supported.',
          unknown: `Failed to load puzzle: ${originalError.message}`,
        };

        const userError = new Error(messages[errorType] || messages.unknown);
        userError.originalError = originalError;
        userError.errorType = errorType;
        return userError;
      }

      delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

      async extractPuzzleData(url) {
        let lastError = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
          try {
            const result = await PuzzleConverter.convertSudokuPadUrl(url);
            return result;
          } catch (error) {
            lastError = error;
            const errorType = this.classifyError(error);

            // Don't retry non-retryable errors
            if (!this.isRetryableError(errorType)) {
              throw this.createUserFriendlyError(error, errorType);
            }

            // Don't delay after the last attempt
            if (attempt < this.maxRetries) {
              const delay = Math.min(
                this.baseDelay * Math.pow(2, attempt - 1),
                this.maxDelay
              );
              await this.delay(delay);
            }
          }
        }

        // All retries exhausted
        const errorType = this.classifyError(lastError);
        throw this.createUserFriendlyError(lastError, errorType);
      }
    };

    PuzzleManager = global.PuzzleManager;
  });

  beforeEach(() => {
    puzzleManager = new PuzzleManager();
    jest.clearAllMocks();
  });

  describe('Error Classification', () => {
    test('should classify network errors correctly', () => {
      const networkError = new Error('Network request failed');
      const result = puzzleManager.classifyError(networkError);
      expect(result).toBe('network');
    });

    test('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout exceeded');
      const result = puzzleManager.classifyError(timeoutError);
      expect(result).toBe('timeout');
    });

    test('should classify 404 errors correctly', () => {
      const notFoundError = new Error('Puzzle not found (404)');
      const result = puzzleManager.classifyError(notFoundError);
      expect(result).toBe('not_found');
    });

    test('should classify 403 errors correctly', () => {
      const forbiddenError = new Error('Access forbidden (403)');
      const result = puzzleManager.classifyError(forbiddenError);
      expect(result).toBe('forbidden');
    });

    test('should classify server errors correctly', () => {
      const serverError = new Error('Internal server error (500)');
      const result = puzzleManager.classifyError(serverError);
      expect(result).toBe('server_error');
    });

    test('should classify parse errors correctly', () => {
      const parseError = new Error('Failed to parse puzzle data');
      const result = puzzleManager.classifyError(parseError);
      expect(result).toBe('parse_error');
    });

    test('should classify unknown errors', () => {
      const unknownError = new Error('Something went wrong');
      const result = puzzleManager.classifyError(unknownError);
      expect(result).toBe('unknown');
    });
  });

  describe('Retryable Error Detection', () => {
    test('should identify retryable errors', () => {
      expect(puzzleManager.isRetryableError('network')).toBe(true);
      expect(puzzleManager.isRetryableError('timeout')).toBe(true);
      expect(puzzleManager.isRetryableError('server_error')).toBe(true);
    });

    test('should identify non-retryable errors', () => {
      expect(puzzleManager.isRetryableError('not_found')).toBe(false);
      expect(puzzleManager.isRetryableError('forbidden')).toBe(false);
      expect(puzzleManager.isRetryableError('parse_error')).toBe(false);
      expect(puzzleManager.isRetryableError('unknown')).toBe(false);
    });
  });

  describe('User-Friendly Error Messages', () => {
    test('should create user-friendly network error', () => {
      const originalError = new Error('fetch failed');
      const userError = puzzleManager.createUserFriendlyError(
        originalError,
        'network'
      );

      expect(userError.message).toBe(
        'Network connection failed. Please check your internet connection and try again.'
      );
      expect(userError.originalError).toBe(originalError);
      expect(userError.errorType).toBe('network');
    });

    test('should create user-friendly timeout error', () => {
      const originalError = new Error('timeout');
      const userError = puzzleManager.createUserFriendlyError(
        originalError,
        'timeout'
      );

      expect(userError.message).toBe(
        'Request timed out. The puzzle server may be slow to respond. Please try again.'
      );
    });

    test('should create user-friendly not found error', () => {
      const originalError = new Error('404');
      const userError = puzzleManager.createUserFriendlyError(
        originalError,
        'not_found'
      );

      expect(userError.message).toBe(
        'Puzzle not found. Please check that the URL is correct and the puzzle exists.'
      );
    });

    test('should create user-friendly forbidden error', () => {
      const originalError = new Error('403');
      const userError = puzzleManager.createUserFriendlyError(
        originalError,
        'forbidden'
      );

      expect(userError.message).toBe(
        'Access denied. This puzzle may be private or the URL may be incorrect.'
      );
    });

    test('should create user-friendly server error', () => {
      const originalError = new Error('500');
      const userError = puzzleManager.createUserFriendlyError(
        originalError,
        'server_error'
      );

      expect(userError.message).toBe(
        'SudokuPad server error. Please try again in a few moments.'
      );
    });

    test('should create user-friendly parse error', () => {
      const originalError = new Error('invalid JSON');
      const userError = puzzleManager.createUserFriendlyError(
        originalError,
        'parse_error'
      );

      expect(userError.message).toBe(
        'Unable to parse puzzle data. The puzzle format may not be supported.'
      );
    });

    test('should handle unknown error types', () => {
      const originalError = new Error('mysterious error');
      const userError = puzzleManager.createUserFriendlyError(
        originalError,
        'unknown'
      );

      expect(userError.message).toBe('Failed to load puzzle: mysterious error');
    });
  });

  describe('Basic Retry Logic', () => {
    test('should succeed on first attempt', async () => {
      const mockPuzzleData = {
        title: 'Test Puzzle',
        puzzleId: 'test123',
        originalData: {},
        features: [],
        totalLines: 0,
        featureGroups: [],
      };

      global.PuzzleConverter.convertSudokuPadUrl.mockResolvedValueOnce(
        mockPuzzleData
      );

      const result = await puzzleManager.extractPuzzleData(
        'https://sudokupad.app/test123'
      );

      expect(result).toEqual(mockPuzzleData);
      expect(global.PuzzleConverter.convertSudokuPadUrl).toHaveBeenCalledTimes(
        1
      );
    });

    test('should not retry non-retryable errors', async () => {
      const notFoundError = new Error('Puzzle not found (404)');

      global.PuzzleConverter.convertSudokuPadUrl.mockRejectedValueOnce(
        notFoundError
      );

      await expect(
        puzzleManager.extractPuzzleData('https://sudokupad.app/test123')
      ).rejects.toThrow('Puzzle not found');

      expect(global.PuzzleConverter.convertSudokuPadUrl).toHaveBeenCalledTimes(
        1
      );
    });
  });

  describe('Error Handling Integration', () => {
    test('should preserve original error for debugging', async () => {
      const originalError = new Error('Original network failure');
      originalError.stack = 'Original stack trace';

      global.PuzzleConverter.convertSudokuPadUrl.mockRejectedValue(
        originalError
      );

      try {
        await puzzleManager.extractPuzzleData('https://sudokupad.app/test123');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.originalError).toBe(originalError);
        expect(error.originalError.stack).toBe('Original stack trace');
        expect(error.errorType).toBe('network');
      }
    });
  });

  describe('Delay Utility', () => {
    test('should create proper delay promises', () => {
      const delayPromise = puzzleManager.delay(100);
      expect(delayPromise).toBeInstanceOf(Promise);
    });

    test('should handle zero delay', async () => {
      const delayPromise = puzzleManager.delay(0);
      await expect(delayPromise).resolves.toBeUndefined();
    });
  });
});
