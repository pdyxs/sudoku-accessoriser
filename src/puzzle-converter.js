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
      
      // Process puzzle data to extract line features
      return this.processPuzzleData(finalData, puzzleId);
    } catch (error) {
      console.error('Failed to resolve puzzle data:', error);
      throw new Error(`Failed to load puzzle: ${error.message}`);
    }
  }
  
  static processPuzzleData(puzzleData, puzzleId) {
    console.log('Processing puzzle data for line features...');
    
    // Extract line features by grouping lines by color
    const lineFeatures = this.extractLineFeatures(puzzleData);
    
    return {
      title: puzzleData.metadata?.title || puzzleData.title || "SudokuPad Puzzle",
      puzzleId: puzzleId,
      originalData: puzzleData,
      features: lineFeatures,
      // Diagnostic info
      totalLines: puzzleData.lines?.length || 0,
      featureGroups: lineFeatures.length
    };
  }
  
  static extractLineFeatures(puzzleData) {
    if (!puzzleData.lines || !Array.isArray(puzzleData.lines)) {
      console.log('No lines found in puzzle data');
      return [];
    }
    
    console.log(`Found ${puzzleData.lines.length} total lines`);
    
    // Group lines by color (including overlay lines)
    const colorGroups = {};
    
    puzzleData.lines.forEach(line => {
      const color = line.color;
      if (!colorGroups[color]) {
        colorGroups[color] = [];
      }
      colorGroups[color].push(line);
    });
    
    console.log(`Grouped lines into ${Object.keys(colorGroups).length} color groups:`, Object.keys(colorGroups));
    
    // Convert color groups to feature format
    const features = Object.keys(colorGroups).map(color => {
      const lines = colorGroups[color];
      
      return {
        category: "lines",
        count: lines.length,
        
        // Visual properties extracted from first line (assuming all lines in group have same properties)
        visual: {
          color: color,
          thickness: lines[0].thickness
        },
        
        // Customization options - focus on color only initially
        customizable: {
          color: { 
            type: "color", 
            default: color
          }
        },
        
        // Original line data for reconstruction
        lines: lines
      };
    });
    
    console.log(`Created ${features.length} line features:`, features.map(f => `${f.visual.color} (${f.count} lines)`));
    
    return features;
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