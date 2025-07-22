# SudokuPad URL to JSON Conversion Implementation Plan

## Overview
Based on analysis of the reference repository at https://github.com/marktekfan/sudokupad-penpa-import, this plan outlines how to implement SudokuPad URL to JSON conversion for the vanilla JS accessibility customizer.

## Reference Repository Analysis

### Key Components
1. **Main UI Flow** (TheConverter.vue):
   - Text input for SudokuPad URLs
   - Action dropdown with "Convert to JSON" option
   - Convert button that triggers conversion
   - Output displays converted JSON

2. **Core Conversion Logic** (puzzle-link-converter.ts):
   - `convertPuzzleAsync()` - main conversion function
   - Handles multiple URL formats (Penpa+, F-Puzzles, SudokuPad/CTC)
   - Uses regex patterns to identify SudokuPad URLs: `/(?<puzzleid>[a-z0-9]+)/`

3. **SudokuPad Utilities** (src/sudokupad folder):
   - `puzzleloader.js` - fetches and processes puzzle data
   - `puzzletools.js` - general puzzle manipulation utilities
   - `utilities.js` - helper functions
   - `fpuzzlesdecoder.js` - handles F-Puzzles format
   - `puzzlezipper.js` - compression/decompression

## Conversion Flow Trace

### Input: SudokuPad URL
Example: `https://sudokupad.app/psxczr0jpr`

### Processing Steps:
1. **URL Pattern Matching**: Extract puzzle ID (`psxczr0jpr`) using regex
2. **Puzzle Fetching**: Use puzzleloader.js to retrieve puzzle data from SudokuPad API
3. **Data Processing**: Transform raw puzzle data into standardized format
4. **JSON Output**: Return formatted JSON (as seen in sample-sudokupad.json)

## Implementation Plan for Existing Vanilla JS Structure

### Current Application Structure
The application already has:
- `index.html` with a 3-step wizard interface
- `src/script.js` with a `SudokuAccessoriser` class
- URL input form (`#puzzle-url-form`) in step 1
- Features customization in step 2
- Preview/export in step 3
- Existing `extractPuzzleData()` method (currently stubbed)

### Phase 1: Copy Core Utilities
Create `src/sudokupad/` directory and copy utilities:
- `puzzleloader.js` → `src/sudokupad/puzzleloader.js`
- `puzzletools.js` → `src/sudokupad/puzzletools.js`
- `utilities.js` → `src/sudokupad/utilities.js`
- `fpuzzlesdecoder.js` → `src/sudokupad/fpuzzlesdecoder.js`
- `puzzlezipper.js` → `src/sudokupad/puzzlezipper.js`

**Modifications needed:**
- Convert ES6 imports/exports to work with script tags or Parcel
- Ensure all dependencies are properly resolved
- Test utilities independently

### Phase 2: Create Basic Conversion Module Structure
Create the foundational `PuzzleConverter` class without the feature processing:

```javascript
// src/puzzle-converter.js
class PuzzleConverter {
  static async convertSudokuPadUrl(url) {
    // Extract puzzle ID from URL
    const puzzleId = this.extractPuzzleId(url);
    
    if (!puzzleId) {
      throw new Error('Invalid SudokuPad URL format');
    }
    
    // Use puzzleloader to fetch puzzle data
    const rawPuzzleData = await PuzzleLoader.fetchPuzzle(puzzleId);
    
    // Return raw data for testing - processPuzzleData will be added later
    return {
      title: rawPuzzleData.title || "SudokuPad Puzzle",
      originalData: rawPuzzleData,
      rawData: rawPuzzleData // For testing purposes
    };
  }
  
  static extractPuzzleId(url) {
    const match = url.match(/sudokupad\.app\/([a-z0-9]+)/);
    return match ? match[1] : null;
  }
  
  // processPuzzleData method will be implemented in Phase 4
  // extractFeatures method will be implemented in Phase 4
}
```

### Phase 3: Test Puzzle Retrieval System
Using the basic converter structure, thoroughly test the puzzle retrieval:

1. **Create Test Harness**: Build a minimal test page to verify puzzle loading works
2. **Test Basic Retrieval**: Verify we can fetch raw puzzle data from test URL (https://sudokupad.app/psxczr0jpr)
3. **Validate Output Format**: Confirm retrieved data matches the format in `sample-sudokupad.json`
4. **Test Error Scenarios**: Handle invalid URLs, network failures, missing puzzles
5. **Document Data Structure**: Create documentation of the raw puzzle data format for reference

**Test Implementation:**
Create `test-puzzle-retrieval.html` with basic interface to:
- Input SudokuPad URL
- Display raw retrieved JSON
- Show any errors encountered
- Validate against sample data

### Phase 4: Analyze and Improve Feature Format
Review the current feature format used by `extractFeatures()` and improve it:

**Current Format Analysis:**
```javascript
// Current stub format in script.js
{
  type: "line",
  name: "Thermometer Lines", 
  color: "#ff6b6b",
  count: 3,
  customizable: ["color", "style", "thickness"]
}
```

**Improvement Tasks:**
1. **Analyze Real Puzzle Data**: Examine actual SCL format from retrieved puzzles
2. **Design Better Format**: Create a more comprehensive feature description format
3. **Support More Feature Types**: Handle all SudokuPad constraint types (lines, regions, arrows, circles, etc.)
4. **Improve Customization Options**: Define what properties can actually be customized for each feature type
5. **Add Feature Metadata**: Include position data, constraint relationships, etc.

**Proposed Enhanced Format:**
```javascript
{
  id: "unique-feature-id",
  type: "thermometer", // More specific types
  category: "line", // General category for UI grouping
  name: "Thermometer Lines",
  description: "Temperature constraints that increase along the line",
  originalData: {...}, // Raw data from puzzle
  visual: {
    color: "#ff6b6b",
    style: "solid",
    thickness: 3,
    opacity: 100
  },
  customizable: {
    color: { type: "color", default: "#ff6b6b" },
    style: { type: "select", options: ["solid", "dashed", "dotted"], default: "solid" },
    thickness: { type: "range", min: 1, max: 10, default: 3 },
    showValues: { type: "boolean", default: false }
  },
  count: 3,
  positions: [...] // Coordinate data if needed
}
```

### Phase 5: Complete Conversion Module
After testing and feature format design, complete the `PuzzleConverter` class:

```javascript
// Add to existing src/puzzle-converter.js
class PuzzleConverter {
  // ... existing methods from Phase 2 ...
  
  static processPuzzleData(rawData) {
    // Transform raw puzzle data into the format expected by SudokuAccessoriser
    return {
      title: rawData.title || "SudokuPad Puzzle",
      originalData: rawData, // Keep original for reconstruction
      features: this.extractFeatures(rawData)
    };
  }
  
  static extractFeatures(puzzleData) {
    // Parse puzzle data to identify customizable features
    // This will analyze the SCL format using the improved feature format from Phase 4
    const features = [];
    
    // Implementation will be based on:
    // 1. Real puzzle data structure discovered in Phase 3
    // 2. Improved feature format designed in Phase 4
    
    return features;
  }
}
```

**Update the convertSudokuPadUrl method to use processPuzzleData:**
```javascript
static async convertSudokuPadUrl(url) {
  // Extract puzzle ID from URL
  const puzzleId = this.extractPuzzleId(url);
  
  if (!puzzleId) {
    throw new Error('Invalid SudokuPad URL format');
  }
  
  // Use puzzleloader to fetch puzzle data
  const rawPuzzleData = await PuzzleLoader.fetchPuzzle(puzzleId);
  
  // Process and return puzzle data with features (using improved format)
  return this.processPuzzleData(rawPuzzleData);
}
```

### Phase 6: Integration with Existing SudokuAccessoriser Class
Only after puzzle retrieval is tested and feature format is improved:

Modify the existing `extractPuzzleData()` method in `src/script.js`:

```javascript
// Replace the stubbed extractPuzzleData method
async extractPuzzleData(puzzleUrl) {
    try {
        // Use the new PuzzleConverter with improved feature format
        return await PuzzleConverter.convertSudokuPadUrl(puzzleUrl);
    } catch (error) {
        console.error('Puzzle conversion failed:', error);
        throw new Error('Failed to extract puzzle data');
    }
}
```

**Additional modifications to SudokuAccessoriser:**
- Import/include the PuzzleConverter and sudokupad utilities  
- Update feature rendering code to work with new feature format
- Update `generateCustomizedPuzzleUrl()` to reconstruct puzzle with customizations
- Enhance feature processing to handle real puzzle data structure

### Phase 7: Module Loading and Dependencies
Update `index.html` to load the new modules:

```html
<!-- Add before script.js -->
<script src="./src/sudokupad/utilities.js"></script>
<script src="./src/sudokupad/puzzlezipper.js"></script>
<script src="./src/sudokupad/puzzleloader.js"></script>
<script src="./src/sudokupad/puzzletools.js"></script>
<script src="./src/sudokupad/fpuzzlesdecoder.js"></script>
<script src="./src/puzzle-converter.js"></script>
<script src="./src/script.js"></script>
```

Or configure Parcel to handle module bundling if using ES6 imports.

### Phase 8: UI Integration & Testing
1. **Module Integration**: Ensure all utilities work together with existing SudokuAccessoriser class
2. **Feature Rendering**: Update UI code to work with new feature format
3. **UI Integration**: Ensure extracted features display correctly in the existing features grid
4. **Customization Testing**: Verify all customization controls work with new format
5. **Error Handling**: Implement robust error handling for network failures, invalid URLs

### Phase 9: Puzzle Reconstruction
Enhance `generateCustomizedPuzzleUrl()` method to:
1. Take the original puzzle data and user customizations
2. Apply customizations to the puzzle data structure
3. Generate new SudokuPad-compatible URL with modified puzzle
4. Handle URL encoding and compression as needed

### Phase 10: Build System Integration
Since the project uses Parcel:
1. Configure Parcel to handle the new modules (likely already works)
2. Ensure proper bundling of sudokupad utilities
3. Test build process generates working deployment
4. Verify CORS handling for SudokuPad API calls

## Key Technical Considerations

### Dependencies
- The sudokupad utilities may have dependencies that need to be resolved
- Network requests will need CORS handling or proxy setup
- Compression/decompression libraries may be required

### Error Handling
- Invalid URL formats
- Network connectivity issues
- Puzzle not found scenarios
- Malformed puzzle data

### Performance
- Cache puzzle data to avoid repeated API calls
- Consider lazy loading of utilities
- Optimize for mobile devices

## Next Steps
1. Start with Phase 1: Copy and adapt the core utilities
2. Create minimal test harness to verify utility functions
3. Implement basic conversion pipeline
4. Build UI components incrementally
5. Integration testing with real SudokuPad URLs