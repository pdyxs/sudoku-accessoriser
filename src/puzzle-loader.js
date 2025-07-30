/**
 * PuzzleLoader - Handles puzzle URL processing and data extraction
 * Extracted from SudokuAccessoriser for better separation of concerns
 */
class PuzzleLoader {
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
        
        try {
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
            console.error('Failed to extract puzzle data:', error);
            throw new Error(`Failed to extract puzzle data: ${error.message}`);
        }
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