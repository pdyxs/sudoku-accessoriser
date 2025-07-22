// Basic PuzzleConverter class for SudokuPad URL to JSON conversion
// Phase 2: Basic structure without feature processing (that comes in Phase 5)

class PuzzleConverter {
  static async convertSudokuPadUrl(url) {
    // Extract puzzle ID from URL
    const puzzleId = this.extractPuzzleId(url);
    
    if (!puzzleId) {
      throw new Error('Invalid SudokuPad URL format');
    }
    
    console.log(`Extracted puzzle ID: ${puzzleId}`);
    
    try {
      // Use resolvePuzzleData which does the complete fetch -> parse -> decompress flow
      console.log('Using resolvePuzzleData for complete processing...');
      const resolvedData = await PuzzleLoader.resolvePuzzleData(puzzleId);
      
      console.log('Resolved data type:', typeof resolvedData);
      console.log('Resolved data sample:', JSON.stringify(resolvedData).substring(0, 200));
      
      // Return basic structure for testing - processPuzzleData will be added later
      return {
        title: resolvedData.title || resolvedData.name || "SudokuPad Puzzle",
        originalData: resolvedData,
        puzzleId: puzzleId,
        dataType: typeof resolvedData,
        // Add some diagnostic info
        hasGrid: !!resolvedData.grid,
        hasLines: !!resolvedData.lines,
        hasRegions: !!resolvedData.regions,
        hasCages: !!resolvedData.cages,
        // features will be added in Phase 5 after format improvement
      };
    } catch (error) {
      console.error('Failed to resolve puzzle data:', error);
      throw new Error(`Failed to load puzzle: ${error.message}`);
    }
  }
  
  static extractPuzzleId(url) {
    if (typeof url !== 'string') {
      return null;
    }
    
    // Match SudokuPad URLs like:
    // https://sudokupad.app/psxczr0jpr
    // https://www.sudokupad.app/psxczr0jpr
    // https://sudokupad.app/puzzle/psxczr0jpr (if they add /puzzle/ path)
    const sudokuPadRegex = /(?:https?:\/\/)(?:www\.)?sudokupad\.app\/(?:puzzle\/)?([a-z0-9]+)(?:\?.*)?(?:#.*)?$/i;
    
    const match = url.match(sudokuPadRegex);
    return match ? match[1] : null;
  }
  
  static isValidSudokuPadUrl(url) {
    return this.extractPuzzleId(url) !== null;
  }
  
  // Utility method for testing
  static async testConnection() {
    try {
      // Test if we can reach SudokuPad API
      const testId = 'psxczr0jpr';
      const testUrl = PuzzleLoader.apiPuzzleUrlLocal(testId);
      
      console.log(`Testing connection to: ${testUrl}`);
      
      // Just test if the URL is reachable (don't actually fetch)
      return {
        success: true,
        testUrl: testUrl,
        message: 'PuzzleLoader API URLs generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate API URLs'
      };
    }
  }
  
  // processPuzzleData method will be implemented in Phase 5
  // extractFeatures method will be implemented in Phase 5
}

// Export for vanilla JS/Parcel
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PuzzleConverter };
} else if (typeof window !== 'undefined') {
  window.PuzzleConverter = PuzzleConverter;
}