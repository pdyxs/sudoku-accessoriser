/**
 * Tests for line feature extraction functionality
 * Migrated from test-line-features.html  
 * @jest-environment jsdom
 */

const { setupSudokuPadEnvironment, setupSudokuPadMocks } = require('../helpers/sudokupad-setup');
const { setupSudokuPadAPIMock, addMockPuzzle } = require('../__mocks__/sudokupad-api');

describe('Line Feature Extraction', () => {
  let moduleLoader;
  
  beforeAll(() => {
    // Setup mocks first
    setupSudokuPadMocks();
    setupSudokuPadAPIMock();
    
    // Load all the SudokuPad utilities and PuzzleConverter
    moduleLoader = setupSudokuPadEnvironment();
  });

  // Sample data from the original HTML test
  const samplePuzzleData = {
    "metadata": {
      "title": "Pure Toss",
      "author": "Philipp Blume, aka glum_hippo", 
      "rules": "Standard 159, German Whispers, and Renban rules."
    },
    "lines": [
      {"wayPoints": [[5.5, 6.5], [3.5, 6.5], [3.5, 7.5], [5.5, 7.5]], "color": "#67f067ff", "thickness": 9.6},
      {"wayPoints": [[6.5, 3.5], [5.5, 4.5], [6.5, 5.5]], "color": "#67f067ff", "thickness": 9.6},
      {"wayPoints": [[6.5, 2.5], [4.5, 2.5]], "color": "#67f067ff", "thickness": 9.6},
      {"wayPoints": [[7.5, 2.5], [8.5, 3.5]], "color": "#67f067ff", "thickness": 9.6},
      {"wayPoints": [[0.5, 5.5], [2.5, 7.5]], "color": "#67f067ff", "thickness": 9.6},
      {"wayPoints": [[5.5, 0.5], [3.5, 0.5], [3.5, 1.5], [5.5, 1.5]], "color": "#f067f0ff", "thickness": 9.6},
      {"wayPoints": [[3.5, 3.5], [2.5, 4.5], [3.5, 5.5]], "color": "#f067f0ff", "thickness": 9.6},
      {"wayPoints": [[4.5, 8.5], [2.5, 8.5]], "color": "#f067f0ff", "thickness": 9.6},
      {"wayPoints": [[8.5, 5.5], [6.5, 7.5]], "color": "#f067f0ff", "thickness": 9.6},
      {"wayPoints": [[0.5, 3.5], [1.5, 2.5]], "color": "#f067f0ff", "thickness": 9.6}
    ]
  };

  describe('Sample Data Processing', () => {
    test('should process sample puzzle data correctly', () => {
      const processedData = PuzzleConverter.processPuzzleData(samplePuzzleData, 'sample');
      
      expect(processedData).toBeDefined();
      expect(processedData.title).toBe('Pure Toss');
      expect(processedData.totalLines).toBe(10);
      expect(processedData.featureGroups).toBeGreaterThan(0);
      expect(processedData.features).toBeDefined();
      expect(Array.isArray(processedData.features)).toBe(true);
    });

    test('should extract correct number of feature groups', () => {
      const processedData = PuzzleConverter.processPuzzleData(samplePuzzleData, 'sample');
      
      // Should have 2 feature groups (green and purple lines)
      expect(processedData.featureGroups).toBe(2);
      expect(processedData.features).toHaveLength(2);
    });

    test('should group lines by color correctly', () => {
      const processedData = PuzzleConverter.processPuzzleData(samplePuzzleData, 'sample');
      
      // Check that we have the expected colors
      const colors = processedData.features.map(f => f.visual.color);
      expect(colors).toContain('#67f067ff'); // Green
      expect(colors).toContain('#f067f0ff'); // Purple
      
      // Check line counts
      const greenFeature = processedData.features.find(f => f.visual.color === '#67f067ff');
      const purpleFeature = processedData.features.find(f => f.visual.color === '#f067f0ff');
      
      expect(greenFeature).toBeDefined();
      expect(purpleFeature).toBeDefined();
      expect(greenFeature.count).toBe(5); // 5 green lines
      expect(purpleFeature.count).toBe(5); // 5 purple lines
    });

    test('should preserve line properties correctly', () => {
      const processedData = PuzzleConverter.processPuzzleData(samplePuzzleData, 'sample');
      
      processedData.features.forEach(feature => {
        expect(feature.category).toBe('lines');
        expect(feature.visual).toBeDefined();
        expect(feature.visual.color).toBeDefined();
        expect(feature.visual.thickness).toBe(9.6);
        expect(feature.lines).toBeDefined();
        expect(Array.isArray(feature.lines)).toBe(true);
        expect(feature.lines.length).toBe(feature.count);
        
        // Check that each line has the expected properties
        feature.lines.forEach(line => {
          expect(line.wayPoints).toBeDefined();
          expect(Array.isArray(line.wayPoints)).toBe(true);
          expect(line.color).toBe(feature.visual.color);
          expect(line.thickness).toBe(9.6);
        });
      });
    });

    test('should handle customizable properties', () => {
      const processedData = PuzzleConverter.processPuzzleData(samplePuzzleData, 'sample');
      
      processedData.features.forEach(feature => {
        expect(feature.customizable).toBeDefined();
        expect(feature.customizable.color).toBeDefined();
        expect(feature.customizable.color.default).toBe(feature.visual.color);
      });
    });
  });

  describe('Real Puzzle Integration', () => {
    beforeEach(() => {
      // Add a mock puzzle with known line features for testing
      addMockPuzzle('line-features-test', {
        title: 'Line Features Test Puzzle',
        data: {
          lines: [
            {"wayPoints": [[1, 1], [2, 2]], "color": "#ff0000ff", "thickness": 2},
            {"wayPoints": [[3, 3], [4, 4]], "color": "#ff0000ff", "thickness": 2},
            {"wayPoints": [[5, 5], [6, 6]], "color": "#00ff00ff", "thickness": 1},
            {"wayPoints": [[7, 7], [8, 8]], "color": "#0000ffff", "thickness": 3}
          ]
        }
      });
    });

    test('should convert real puzzle URL and extract line features', async () => {
      const result = await PuzzleConverter.convertSudokuPadUrl('https://sudokupad.app/line-features-test');
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Line Features Test Puzzle');
      expect(result.totalLines).toBe(4);
      expect(result.features).toBeDefined();
      expect(result.features.length).toBe(3); // 3 different colors
    });

    test('should handle puzzle with no lines', async () => {
      addMockPuzzle('no-lines-test', {
        title: 'No Lines Puzzle',
        data: {
          grid: Array(9).fill().map(() => Array(9).fill(0))
          // No lines property
        }
      });
      
      const result = await PuzzleConverter.convertSudokuPadUrl('https://sudokupad.app/no-lines-test');
      
      expect(result.totalLines).toBe(0);
      expect(result.features).toHaveLength(0);
      expect(result.featureGroups).toBe(0);
    });

    test('should handle puzzle with empty lines array', async () => {
      addMockPuzzle('empty-lines-test', {
        title: 'Empty Lines Puzzle',
        data: {
          lines: [],
          grid: Array(9).fill().map(() => Array(9).fill(0))
        }
      });
      
      const result = await PuzzleConverter.convertSudokuPadUrl('https://sudokupad.app/empty-lines-test');
      
      expect(result.totalLines).toBe(0);
      expect(result.features).toHaveLength(0);
      expect(result.featureGroups).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle puzzle data without metadata', () => {
      const dataWithoutMetadata = {
        lines: [
          {"wayPoints": [[1, 1], [2, 2]], "color": "#ff0000ff", "thickness": 2}
        ]
      };
      
      const processedData = PuzzleConverter.processPuzzleData(dataWithoutMetadata, 'test');
      
      expect(processedData.title).toBe('SudokuPad Puzzle'); // Default title
      expect(processedData.totalLines).toBe(1);
      expect(processedData.features).toHaveLength(1);
    });

    test('should handle lines with missing properties', () => {
      const dataWithIncompleteLines = {
        lines: [
          {"wayPoints": [[1, 1], [2, 2]], "color": "#ff0000ff"}, // Missing thickness
          {"wayPoints": [[3, 3], [4, 4]], "thickness": 2}, // Missing color
          {"color": "#00ff00ff", "thickness": 1} // Missing wayPoints
        ]
      };
      
      // Should not throw an error
      expect(() => {
        PuzzleConverter.processPuzzleData(dataWithIncompleteLines, 'test');
      }).not.toThrow();
    });

    test('should handle lines with invalid color formats', () => {
      const dataWithInvalidColors = {
        lines: [
          {"wayPoints": [[1, 1], [2, 2]], "color": "red", "thickness": 2}, // Named color
          {"wayPoints": [[3, 3], [4, 4]], "color": "#fff", "thickness": 2}, // Short hex
          {"wayPoints": [[5, 5], [6, 6]], "color": "", "thickness": 2} // Empty color
        ]
      };
      
      const processedData = PuzzleConverter.processPuzzleData(dataWithInvalidColors, 'test');
      
      expect(processedData.totalLines).toBe(3);
      expect(processedData.features.length).toBeGreaterThan(0);
    });

    test('should handle duplicate colors with different thicknesses', () => {
      const dataWithMixedThickness = {
        lines: [
          {"wayPoints": [[1, 1], [2, 2]], "color": "#ff0000ff", "thickness": 2},
          {"wayPoints": [[3, 3], [4, 4]], "color": "#ff0000ff", "thickness": 3}, // Same color, different thickness
          {"wayPoints": [[5, 5], [6, 6]], "color": "#ff0000ff", "thickness": 2}
        ]
      };
      
      const processedData = PuzzleConverter.processPuzzleData(dataWithMixedThickness, 'test');
      
      // Should group by color, not thickness
      expect(processedData.features).toHaveLength(1);
      expect(processedData.features[0].count).toBe(3);
    });
  });
});