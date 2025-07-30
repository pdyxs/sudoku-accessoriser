/**
 * Tests for curved lines support
 * Migrated from test-curved-lines.html
 * @jest-environment jsdom
 */

const { setupSudokuPadEnvironment, setupSudokuPadMocks } = require('../helpers/sudokupad-setup');
const fs = require('fs');
const path = require('path');

describe('Curved Lines Support', () => {
  let moduleLoader;
  let curvedExampleData;
  
  beforeAll(() => {
    // Setup mocks first
    setupSudokuPadMocks();
    
    // Load all the SudokuPad utilities and PuzzleConverter
    moduleLoader = setupSudokuPadEnvironment();
    
    // Load the curved example data
    const curvedFilePath = path.resolve(process.cwd(), 'examples/example-curved.json');
    const curvedFileContent = fs.readFileSync(curvedFilePath, 'utf8');
    curvedExampleData = JSON.parse(curvedFileContent);
  });

  describe('Curved Example Data Processing', () => {
    test('should load curved example data correctly', () => {
      expect(curvedExampleData).toBeDefined();
      expect(curvedExampleData.lines).toBeDefined();
      expect(Array.isArray(curvedExampleData.lines)).toBe(true);
      expect(curvedExampleData.lines.length).toBeGreaterThan(0);
    });

    test('should process curved puzzle data correctly', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      expect(processedData).toBeDefined();
      expect(processedData.title).toBe('EITBON 4: Post Awareness Confusions');
      expect(processedData.totalLines).toBeGreaterThan(0);
      expect(processedData.featureGroups).toBeGreaterThan(0);
      expect(processedData.features).toBeDefined();
      expect(Array.isArray(processedData.features)).toBe(true);
    });

    test('should detect different line types correctly', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      // Check that we have features with lines
      expect(processedData.features.length).toBeGreaterThan(0);
      
      let hasCurvedLines = false;
      let hasStraightLines = false;
      
      processedData.features.forEach(feature => {
        feature.lines.forEach(line => {
          if (line.d) {
            hasCurvedLines = true;
          }
          if (line.wayPoints) {
            hasStraightLines = true;
          }
        });
      });
      
      // The curved example should have curved lines (with 'd' property)
      expect(hasCurvedLines).toBe(true);
    });

    test('should group curved lines by color correctly', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      // Check that we have multiple color groups
      expect(processedData.features.length).toBeGreaterThan(1);
      
      // Verify each feature has consistent color
      processedData.features.forEach(feature => {
        expect(feature.visual.color).toBeDefined();
        expect(feature.count).toBeGreaterThan(0);
        expect(feature.lines).toHaveLength(feature.count);
        
        // All lines in a feature should have the same color
        feature.lines.forEach(line => {
          expect(line.color).toBe(feature.visual.color);
        });
      });
    });

    test('should preserve SVG path data for curved lines', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      let foundCurvedLine = false;
      
      processedData.features.forEach(feature => {
        feature.lines.forEach(line => {
          if (line.d) {
            foundCurvedLine = true;
            expect(typeof line.d).toBe('string');
            expect(line.d.length).toBeGreaterThan(0);
            // SVG path should start with M (moveTo command)
            expect(line.d).toMatch(/^M/);
          }
        });
      });
      
      expect(foundCurvedLine).toBe(true);
    });

    test('should handle different line thicknesses', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      const thicknesses = new Set();
      
      processedData.features.forEach(feature => {
        expect(feature.visual.thickness).toBeDefined();
        thicknesses.add(feature.visual.thickness);
        
        // All lines in a feature should have consistent thickness
        feature.lines.forEach(line => {
          expect(line.thickness).toBe(feature.visual.thickness);
        });
      });
      
      // Should have multiple thickness values in the example
      expect(thicknesses.size).toBeGreaterThan(1);
    });
  });

  describe('Line Type Analysis', () => {
    test('should distinguish between curved and straight lines', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      const lineTypes = {
        curved: 0,
        straight: 0,
        other: 0
      };
      
      processedData.features.forEach(feature => {
        feature.lines.forEach(line => {
          if (line.wayPoints && Array.isArray(line.wayPoints)) {
            lineTypes.straight++;
          } else if (line.d && typeof line.d === 'string') {
            lineTypes.curved++;
          } else {
            lineTypes.other++;
          }
        });
      });
      
      // Report line type distribution
      console.log('Line type distribution:', lineTypes);
      
      // Should have curved lines in this example
      expect(lineTypes.curved).toBeGreaterThan(0);
    });

    test('should handle overlay lines correctly', () => {
      // Look for lines with target: "overlay" property
      const overlayLines = curvedExampleData.lines.filter(line => line.target === 'overlay');
      
      if (overlayLines.length > 0) {
        const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
        
        // Overlay lines should still be processed and grouped by color
        expect(processedData.totalLines).toBeGreaterThanOrEqual(overlayLines.length);
      }
    });

    test('should preserve line properties for different line types', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      processedData.features.forEach(feature => {
        feature.lines.forEach(line => {
          // All lines should have color and thickness
          expect(line.color).toBeDefined();
          expect(line.thickness).toBeDefined();
          
          // Lines should have either wayPoints or d property
          const hasWayPoints = line.wayPoints && Array.isArray(line.wayPoints);
          const hasSVGPath = line.d && typeof line.d === 'string';
          
          expect(hasWayPoints || hasSVGPath).toBe(true);
        });
      });
    });
  });

  describe('Color Analysis', () => {
    test('should identify expected colors from curved example', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      const colors = processedData.features.map(f => f.visual.color);
      
      // Based on the example file, we expect to see these colors:
      const expectedColors = ['#67f067ff', '#ffa600ff', '#000000'];
      
      expectedColors.forEach(expectedColor => {
        const hasColor = colors.some(color => color === expectedColor);
        if (hasColor) {
          console.log(`✓ Found expected color: ${expectedColor}`);
        }
      });
      
      // Should have multiple distinct colors
      expect(colors.length).toBeGreaterThan(1);
    });

    test('should handle black overlay lines', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      // Look for black lines (typically overlay/decoration lines)
      const blackFeature = processedData.features.find(f => f.visual.color === '#000000');
      
      if (blackFeature) {
        expect(blackFeature.count).toBeGreaterThan(0);
        expect(blackFeature.lines.length).toBe(blackFeature.count);
        
        // Black lines should be thin (overlay style)
        expect(blackFeature.visual.thickness).toBeLessThan(5);
      }
    });
  });

  describe('Data Integrity', () => {
    test('should maintain consistent data structure for curved lines', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      processedData.features.forEach(feature => {
        expect(feature.category).toBe('lines');
        expect(feature.customizable).toBeDefined();
        expect(feature.customizable.color).toBeDefined();
        expect(feature.customizable.color.default).toBe(feature.visual.color);
      });
    });

    test('should calculate total lines correctly', () => {
      const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
      
      const calculatedTotal = processedData.features.reduce((sum, feature) => sum + feature.count, 0);
      
      expect(processedData.totalLines).toBe(calculatedTotal);
      expect(processedData.totalLines).toBe(curvedExampleData.lines.length);
    });

    test('should handle complex SVG paths', () => {
      const complexPaths = curvedExampleData.lines
        .filter(line => line.d && line.d.length > 50)
        .map(line => line.d);
      
      if (complexPaths.length > 0) {
        const processedData = PuzzleConverter.processPuzzleData(curvedExampleData, 'curved-example');
        
        // Complex paths should still be processed correctly
        expect(processedData.totalLines).toBeGreaterThan(0);
        
        console.log(`Found ${complexPaths.length} complex SVG paths`);
      }
    });
  });
});