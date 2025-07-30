/**
 * PuzzleManager - Handles puzzle URL processing and data extraction
 * Extracted from SudokuAccessoriser for better separation of concerns
 */
class PuzzleManager {
    constructor() {
        // No state needed for this utility class
    }

    /**
     * Validates if a URL is a valid SudokuPad URL
     * @param {string} url - The URL to validate
     * @returns {boolean} - True if valid SudokuPad URL
     */
    isValidSudokuPadUrl(url) {
        // Use PuzzleConverter's validation which handles more URL formats
        return PuzzleConverter.isValidSudokuPadUrl(url);
    }

    /**
     * Extracts puzzle data from a SudokuPad URL
     * @param {string} puzzleUrl - The SudokuPad URL
     * @returns {Promise<Object>} - Extracted puzzle data
     */
    async extractPuzzleData(puzzleUrl) {
        console.log('Extracting puzzle data from:', puzzleUrl);
        
        const maxRetries = 3;
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt}/${maxRetries} to extract puzzle data`);
                
                // Use the PuzzleConverter to extract real puzzle data
                const puzzleData = await PuzzleConverter.convertSudokuPadUrl(puzzleUrl);
                
                console.log('Successfully extracted puzzle data:', puzzleData);
                
                return {
                    title: puzzleData.title,
                    puzzleId: puzzleData.puzzleId,
                    originalData: puzzleData.originalData,
                    features: puzzleData.features,
                    totalLines: puzzleData.totalLines,
                    featureGroups: puzzleData.featureGroups
                };
                
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt} failed:`, error);
                
                // Classify error types for better user feedback
                const errorType = this.classifyError(error);
                
                if (attempt === maxRetries || !this.isRetryableError(errorType)) {
                    throw this.createUserFriendlyError(error, errorType);
                }
                
                // Wait before retrying (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`Retrying in ${delay}ms...`);
                await this.delay(delay);
            }
        }
        
        // This shouldn't be reached, but just in case
        throw this.createUserFriendlyError(lastError, 'unknown');
    }

    /**
     * Classifies error types for better handling
     * @param {Error} error - The error to classify
     * @returns {string} - Error type
     */
    classifyError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) {
            return 'network';
        }
        if (message.includes('timeout')) {
            return 'timeout';
        }
        if (message.includes('404') || message.includes('not found')) {
            return 'not_found';
        }
        if (message.includes('403') || message.includes('forbidden')) {
            return 'forbidden';
        }
        if (message.includes('500') || message.includes('server')) {
            return 'server_error';
        }
        if (message.includes('parse') || message.includes('invalid')) {
            return 'parse_error';
        }
        
        return 'unknown';
    }

    /**
     * Determines if an error type is retryable
     * @param {string} errorType - Error type
     * @returns {boolean} - Whether the error is retryable
     */
    isRetryableError(errorType) {
        const retryableErrors = ['network', 'timeout', 'server_error'];
        return retryableErrors.includes(errorType);
    }

    /**
     * Creates a user-friendly error message
     * @param {Error} originalError - Original error
     * @param {string} errorType - Classified error type
     * @returns {Error} - User-friendly error
     */
    createUserFriendlyError(originalError, errorType) {
        let message = '';
        
        switch (errorType) {
            case 'network':
                message = 'Network connection failed. Please check your internet connection and try again.';
                break;
            case 'timeout':
                message = 'Request timed out. The puzzle server may be slow to respond. Please try again.';
                break;
            case 'not_found':
                message = 'Puzzle not found. Please check that the URL is correct and the puzzle exists.';
                break;
            case 'forbidden':
                message = 'Access denied. This puzzle may be private or the URL may be incorrect.';
                break;
            case 'server_error':
                message = 'SudokuPad server error. Please try again in a few moments.';
                break;
            case 'parse_error':
                message = 'Unable to parse puzzle data. The puzzle format may not be supported.';
                break;
            default:
                message = `Failed to load puzzle: ${originalError.message}`;
        }
        
        const error = new Error(message);
        error.originalError = originalError;
        error.errorType = errorType;
        return error;
    }

    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Extracts puzzle ID from a SudokuPad URL
     * @param {string} url - The SudokuPad URL
     * @returns {string|null} - The puzzle ID or null if not found
     */
    extractPuzzleIdFromUrl(url) {
        return PuzzleConverter.extractPuzzleId(url);
    }

    /**
     * Normalizes a puzzle parameter to a full URL
     * @param {string} puzzleParam - Puzzle ID or URL
     * @returns {string} - Full SudokuPad URL
     */
    normalizePuzzleUrl(puzzleParam) {
        // If it's already a full URL, return as-is
        if (puzzleParam.startsWith('http://') || puzzleParam.startsWith('https://')) {
            return puzzleParam;
        }
        
        // If it contains a slash, it's a custom puzzle (author/name format)
        if (puzzleParam.includes('/')) {
            return `https://sudokupad.app/${puzzleParam}`;
        }
        
        // Otherwise, it's a simple puzzle ID
        return `https://sudokupad.app/${puzzleParam}`;
    }

    /**
     * Gets URL parameter value
     * @param {string} name - Parameter name
     * @returns {string|null} - Parameter value or null
     */
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    /**
     * Updates URL parameter without page reload
     * @param {string} name - Parameter name
     * @param {string} value - Parameter value
     */
    updateUrlParameter(name, value) {
        const url = new URL(window.location);
        if (value) {
            url.searchParams.set(name, value);
        } else {
            url.searchParams.delete(name);
        }
        window.history.pushState({}, '', url);
    }

    /**
     * Checks for puzzle parameter in URL and returns it
     * @returns {string|null} - Puzzle parameter or null
     */
    checkForPuzzleParameter() {
        return this.getUrlParameter('puzzle');
    }
}