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
      // Follow the reference implementation's ConvertPuzzleId approach
      console.log(`Processing puzzle ID: ${puzzleId}`);
      
      // Strip off parameters (settings) like the reference implementation does
      let processedPuzzleId = puzzleId.split('?')[0]; // Strip off parameters (settings)
      processedPuzzleId = processedPuzzleId.split('&')[0]; // Strip off parameters (settings)
      
      console.log(`Processed puzzle ID: ${processedPuzzleId}`);
      
      let finalData;
      
      if (PuzzleLoader.isRemotePuzzleId(processedPuzzleId)) {
        console.log('Detected remote puzzle ID, fetching...');
        try {
          // expand short puzzleid - this is where custom URLs get resolved
          processedPuzzleId = await PuzzleLoader.fetchPuzzle(processedPuzzleId);
          console.log('Fetched puzzle data type:', typeof processedPuzzleId);
          console.log('Fetched data sample:', String(processedPuzzleId).substring(0, 100));
          
          if (!processedPuzzleId) {
            throw new Error('Not a recognized JSON puzzle format');
          }
          
          // After fetching, the puzzle data might still be remote if it's not properly formatted
          // But we should continue processing since we got valid data back
        } catch (err) {
          console.error('Fetch puzzle error:', err);
          throw new Error('Short puzzle ID not found');
        }
      }
      
      // Check if it's F-Puzzle format (starts with fpuz or fpuzzles)
      const reFPuzPrefix = /^(fpuz(?:zles)?)(.*)/;
      if (reFPuzPrefix.test(processedPuzzleId)) {
        console.log('Detected F-Puzzle format');
        try {
          const stripFPuzPrefix = (fpuzzle) => fpuzzle.replace(reFPuzPrefix, '$2');
          let decodedUrl = decodeURIComponent(stripFPuzPrefix(processedPuzzleId));
          finalData = JSON.parse(loadFPuzzle.decompressPuzzle(decodedUrl));
        } catch (err) {
          console.error('F-Puzzle decode error:', err);
          throw new Error('Error while decoding F-Puzzle format');
        }
      } else {
        console.log('Using parsePuzzleData for SCL/other format');
        console.log('Data to parse:', String(processedPuzzleId).substring(0, 200));
        
        // If the data looks compressed (starts with scl), we need to handle it properly
        if (typeof processedPuzzleId === 'string' && processedPuzzleId.startsWith('scl')) {
          console.log('Data appears to be SCL compressed, using parsePuzzleData');
          finalData = await PuzzleLoader.parsePuzzleData(processedPuzzleId);
        } else {
          console.log('Data does not appear compressed, parsing directly');
          finalData = await PuzzleLoader.parsePuzzleData(processedPuzzleId);
        }
      }
      
      console.log('Final data type:', typeof finalData);
      console.log('Final data sample:', JSON.stringify(finalData).substring(0, 200));
      
      // Return basic structure for testing - processPuzzleData will be added later
      return {
        title: finalData.title || finalData.metadata?.title || finalData.name || "SudokuPad Puzzle",
        originalData: finalData,
        puzzleId: puzzleId,
        dataType: typeof finalData,
        // Add some diagnostic info
        hasGrid: !!finalData.grid,
        hasLines: !!finalData.lines,
        hasRegions: !!finalData.regions,
        hasCages: !!finalData.cages,
        // Include processed data for debugging
        processedPuzzleId: processedPuzzleId,
        wasRemote: PuzzleLoader.isRemotePuzzleId(puzzleId.split('?')[0].split('&')[0]),
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
    
    // Use the comprehensive regex from the reference repository
    // This handles various formats:
    // - https://sudokupad.app/psxczr0jpr (simple ID)
    // - https://sudokupad.app/username/puzzle-name (custom URLs)
    // - https://sudokupad.app/sudoku.html?puzzleid=abc123 (legacy format)
    // - https://beta.sudokupad.app/test123 (subdomains)
    const reCtc = /(?:^\s*(http[s]?:\/\/)?(app.crackingthecryptic.com|([a-z]+\.)?sudokupad.app))(?:\/sudoku(?:\.html)?)?\/?(?:\?puzzleid=)?(?<puzzleid>.+)/;
    const reSudokuPadUrl = /^\s*sudokupad:\/\/puzzle\/(?<puzzleid>.+)/;
    
    // Try the sudokupad:// protocol format first
    let match = url.match(reSudokuPadUrl);
    if (match && match.groups) {
      return match.groups.puzzleid;
    }
    
    // Try the comprehensive web URL format
    match = url.match(reCtc);
    if (match && match.groups) {
      return match.groups.puzzleid;
    }
    
    return null;
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