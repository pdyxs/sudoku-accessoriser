/**
 * Tests for FeatureManager class
 * @jest-environment jsdom
 */

describe('FeatureManager', () => {
  let FeatureManager;

  beforeAll(() => {
    // Mock PuzzleZipper for URL generation
    global.PuzzleZipper = {
      zipPuzzle: jest.fn()
    };

    // Define FeatureManager class for testing
    global.FeatureManager = class FeatureManager {
      constructor() {
        this.customizations = {};
      }

      updateCustomization(featureIndex, property, value) {
        if (!this.customizations[featureIndex]) {
          this.customizations[featureIndex] = {};
        }
        
        this.customizations[featureIndex][property] = value;
        
        if (property === 'color') {
          const hex8Color = this.convertToHex8(value);
          const newLinePreview = document.querySelector(`.feature-item:nth-child(${featureIndex + 1}) .new-line`);
          if (newLinePreview) {
            newLinePreview.style.backgroundColor = value;
          }
        }
      }

      getCustomizations() {
        return { ...this.customizations };
      }

      clearCustomizations() {
        this.customizations = {};
      }

      generateCustomizedPuzzleUrl(puzzleData) {
        if (!puzzleData || !puzzleData.originalData) {
          console.error('No puzzle data available for customization');
          return null;
        }

        try {
          const customizedData = JSON.parse(JSON.stringify(puzzleData.originalData));
          this.applyCustomizations(customizedData, puzzleData.features);
          return this.createSudokuPadUrl(customizedData);
        } catch (error) {
          console.error('Failed to generate customized puzzle URL:', error);
          return null;
        }
      }

      applyCustomizations(puzzleData, features) {
        Object.keys(this.customizations).forEach(featureIndexStr => {
          const featureIndex = parseInt(featureIndexStr);
          const customization = this.customizations[featureIndex];
          const feature = features[featureIndex];
          
          if (!feature || feature.category !== 'lines') {
            return;
          }
          
          if (customization.color) {
            const newColor = this.convertToHex8(customization.color);
            
            feature.lines.forEach(featureLine => {
              const puzzleLine = puzzleData.lines.find(line => this.areLinesEqual(line, featureLine));
              if (puzzleLine) {
                puzzleLine.color = newColor;
              }
            });
          }
        });
      }

      areLinesEqual(line1, line2) {
        if (line1.wayPoints && line2.wayPoints) {
          if (line1.wayPoints.length !== line2.wayPoints.length) {
            return false;
          }
          
          for (let i = 0; i < line1.wayPoints.length; i++) {
            const wp1 = line1.wayPoints[i];
            const wp2 = line2.wayPoints[i];
            if (wp1[0] !== wp2[0] || wp1[1] !== wp2[1]) {
              return false;
            }
          }
          return true;
        }
        
        if (line1.d && line2.d) {
          return line1.d === line2.d;
        }
        
        if ((line1.wayPoints && line2.d) || (line1.d && line2.wayPoints)) {
          return false;
        }
        
        return false;
      }

      convertToHex8(hex6Color) {
        if (hex6Color && hex6Color.length === 7 && hex6Color.startsWith('#')) {
          return hex6Color + 'ff';
        }
        return hex6Color;
      }

      convertToHex6(hexColor) {
        if (hexColor && hexColor.length === 9 && hexColor.startsWith('#')) {
          return hexColor.substring(0, 7);
        }
        return hexColor;
      }

      createSudokuPadUrl(puzzleData) {
        try {
          const compressedData = global.PuzzleZipper.zipPuzzle(puzzleData);
          const baseUrl = 'https://sudokupad.app/';
          const fullUrl = `${baseUrl}?puzzle=${encodeURIComponent(compressedData)}`;
          return fullUrl;
        } catch (error) {
          console.error('Failed to create SudokuPad URL:', error);
          throw error;
        }
      }
    };

    FeatureManager = global.FeatureManager;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Customization management', () => {
    test('should initialize with empty customizations', () => {
      const manager = new FeatureManager();
      
      expect(manager.getCustomizations()).toEqual({});
    });

    test('should update customizations', () => {
      const manager = new FeatureManager();
      
      manager.updateCustomization(0, 'color', '#ff0000');
      
      const customizations = manager.getCustomizations();
      expect(customizations[0]).toEqual({ color: '#ff0000' });
    });

    test('should update multiple properties for same feature', () => {
      const manager = new FeatureManager();
      
      manager.updateCustomization(0, 'color', '#ff0000');
      manager.updateCustomization(0, 'thickness', 2);
      
      const customizations = manager.getCustomizations();
      expect(customizations[0]).toEqual({ color: '#ff0000', thickness: 2 });
    });

    test('should handle multiple features', () => {
      const manager = new FeatureManager();
      
      manager.updateCustomization(0, 'color', '#ff0000');
      manager.updateCustomization(1, 'color', '#00ff00');
      
      const customizations = manager.getCustomizations();
      expect(customizations[0]).toEqual({ color: '#ff0000' });
      expect(customizations[1]).toEqual({ color: '#00ff00' });
    });

    test('should clear all customizations', () => {
      const manager = new FeatureManager();
      
      manager.updateCustomization(0, 'color', '#ff0000');
      manager.updateCustomization(1, 'color', '#00ff00');
      manager.clearCustomizations();
      
      expect(manager.getCustomizations()).toEqual({});
    });
  });

  describe('Color conversion', () => {
    test('should convert 6-character hex to 8-character hex', () => {
      const manager = new FeatureManager();
      
      expect(manager.convertToHex8('#ff0000')).toBe('#ff0000ff');
      expect(manager.convertToHex8('#00ff00')).toBe('#00ff00ff');
    });

    test('should handle invalid hex colors', () => {
      const manager = new FeatureManager();
      
      expect(manager.convertToHex8('invalid')).toBe('invalid');
      expect(manager.convertToHex8('#ff00')).toBe('#ff00');
    });

    test('should convert 8-character hex to 6-character hex', () => {
      const manager = new FeatureManager();
      
      expect(manager.convertToHex6('#ff0000ff')).toBe('#ff0000');
      expect(manager.convertToHex6('#00ff0088')).toBe('#00ff00');
    });
  });

  describe('Line comparison', () => {
    test('should compare lines with wayPoints correctly', () => {
      const manager = new FeatureManager();
      
      const line1 = { wayPoints: [[1, 2], [3, 4]] };
      const line2 = { wayPoints: [[1, 2], [3, 4]] };
      const line3 = { wayPoints: [[1, 2], [5, 6]] };
      
      expect(manager.areLinesEqual(line1, line2)).toBe(true);
      expect(manager.areLinesEqual(line1, line3)).toBe(false);
    });

    test('should compare lines with SVG paths correctly', () => {
      const manager = new FeatureManager();
      
      const line1 = { d: 'M10,10 L20,20' };
      const line2 = { d: 'M10,10 L20,20' };
      const line3 = { d: 'M10,10 L30,30' };
      
      expect(manager.areLinesEqual(line1, line2)).toBe(true);
      expect(manager.areLinesEqual(line1, line3)).toBe(false);
    });

    test('should not match lines of different types', () => {
      const manager = new FeatureManager();
      
      const line1 = { wayPoints: [[1, 2], [3, 4]] };
      const line2 = { d: 'M10,10 L20,20' };
      
      expect(manager.areLinesEqual(line1, line2)).toBe(false);
    });
  });

  describe('Puzzle URL generation', () => {
    test('should generate customized puzzle URL', () => {
      const manager = new FeatureManager();
      global.PuzzleZipper.zipPuzzle.mockReturnValue('compressed_data');
      
      const puzzleData = {
        originalData: { lines: [] },
        features: []
      };
      
      const result = manager.generateCustomizedPuzzleUrl(puzzleData);
      
      expect(result).toBe('https://sudokupad.app/?puzzle=compressed_data');
      expect(global.PuzzleZipper.zipPuzzle).toHaveBeenCalledWith({ lines: [] });
    });

    test('should handle missing puzzle data', () => {
      const manager = new FeatureManager();
      
      const result = manager.generateCustomizedPuzzleUrl(null);
      
      expect(result).toBeNull();
    });

    test('should handle compression errors', () => {
      const manager = new FeatureManager();
      global.PuzzleZipper.zipPuzzle.mockImplementation(() => {
        throw new Error('Compression failed');
      });
      
      const puzzleData = {
        originalData: { lines: [] },
        features: []
      };
      
      const result = manager.generateCustomizedPuzzleUrl(puzzleData);
      
      expect(result).toBeNull();
    });
  });

  describe('DOM interaction', () => {
    test('should update color preview when color changes', () => {
      document.body.innerHTML = `
        <div class="feature-item">
          <div class="new-line"></div>
        </div>
      `;
      
      const manager = new FeatureManager();
      
      manager.updateCustomization(0, 'color', '#ff0000');
      
      const newLinePreview = document.querySelector('.new-line');
      expect(newLinePreview.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });
});