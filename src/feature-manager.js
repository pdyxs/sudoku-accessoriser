/**
 * FeatureManager - Handles feature customization and puzzle reconstruction
 * Extracted from SudokuAccessoriser for better separation of concerns
 */
class FeatureManager {
    constructor() {
        this.customizations = {};
    }

    /**
     * Updates a customization for a specific feature
     * @param {number} featureIndex - Index of the feature
     * @param {string} property - Property to update (e.g., 'color')
     * @param {*} value - New value for the property
     */
    updateCustomization(featureIndex, property, value) {
        if (!this.customizations[featureIndex]) {
            this.customizations[featureIndex] = {};
        }
        
        this.customizations[featureIndex][property] = value;
        
        // Update the visual preview in the UI
        if (property === 'color') {
            // Convert 6-character hex to 8-character hex with full opacity
            const hex8Color = this.convertToHex8(value);
            const newLinePreview = document.querySelector(`.feature-item:nth-child(${featureIndex + 1}) .new-line`);
            if (newLinePreview) {
                newLinePreview.style.backgroundColor = value; // Use 6-char hex for CSS
            }
        }
    }

    /**
     * Gets all current customizations
     * @returns {Object} - Current customizations object
     */
    getCustomizations() {
        return { ...this.customizations };
    }

    /**
     * Clears all customizations
     */
    clearCustomizations() {
        this.customizations = {};
    }

    /**
     * Generates a customized puzzle URL with applied customizations
     * @param {Object} puzzleData - Original puzzle data
     * @returns {string|null} - Customized puzzle URL or null if generation fails
     */
    generateCustomizedPuzzleUrl(puzzleData) {
        if (!puzzleData || !puzzleData.originalData) {
            console.error('No puzzle data available for customization');
            return null;
        }

        try {
            // Create a deep copy of the original puzzle data
            const customizedData = JSON.parse(JSON.stringify(puzzleData.originalData));
            
            // Apply all customizations
            this.applyCustomizations(customizedData, puzzleData.features);
            
            // Generate the new SudokuPad URL
            return this.createSudokuPadUrl(customizedData);
            
        } catch (error) {
            console.error('Failed to generate customized puzzle URL:', error);
            return null;
        }
    }

    /**
     * Applies customizations to puzzle data
     * @param {Object} puzzleData - Puzzle data to modify
     * @param {Array} features - Feature definitions
     */
    applyCustomizations(puzzleData, features) {
        // Apply customizations based on our customizations object
        Object.keys(this.customizations).forEach(featureIndexStr => {
            const featureIndex = parseInt(featureIndexStr);
            const customization = this.customizations[featureIndex];
            const feature = features[featureIndex];
            
            // Skip if feature doesn't exist or isn't lines
            if (!feature || feature.category !== 'lines') {
                return;
            }
            
            // Apply color customization to lines
            if (customization.color) {
                const newColor = this.convertToHex8(customization.color);
                
                // Update all lines that match this feature's original color
                feature.lines.forEach(featureLine => {
                    // Find matching line in puzzle data and update its color
                    const puzzleLine = puzzleData.lines.find(line => this.areLinesEqual(line, featureLine));
                    if (puzzleLine) {
                        puzzleLine.color = newColor;
                    }
                });
            }
        });
    }

    /**
     * Compares two lines to determine if they're equal
     * @param {Object} line1 - First line
     * @param {Object} line2 - Second line
     * @returns {boolean} - True if lines are equal
     */
    areLinesEqual(line1, line2) {
        // Compare wayPoints if both lines have them
        if (line1.wayPoints && line2.wayPoints) {
            if (line1.wayPoints.length !== line2.wayPoints.length) {
                return false;
            }
            
            // Compare each waypoint
            for (let i = 0; i < line1.wayPoints.length; i++) {
                const wp1 = line1.wayPoints[i];
                const wp2 = line2.wayPoints[i];
                if (wp1[0] !== wp2[0] || wp1[1] !== wp2[1]) {
                    return false;
                }
            }
            return true;
        }
        
        // Compare d paths if both lines have them (curved lines)
        if (line1.d && line2.d) {
            return line1.d === line2.d;
        }
        
        // Mixed types don't match
        if ((line1.wayPoints && line2.d) || (line1.d && line2.wayPoints)) {
            return false;
        }
        
        return false;
    }

    /**
     * Converts 6-character hex color to 8-character hex with full opacity
     * @param {string} hex6Color - 6-character hex color (e.g., '#ff0000')
     * @returns {string} - 8-character hex color (e.g., '#ff0000ff')
     */
    convertToHex8(hex6Color) {
        // Add full opacity (ff) to 6-character hex colors
        if (hex6Color && hex6Color.length === 7 && hex6Color.startsWith('#')) {
            return hex6Color + 'ff';
        }
        return hex6Color;
    }

    /**
     * Converts 8-character hex color to 6-character hex for HTML color input
     * @param {string} hexColor - 8-character hex color
     * @returns {string} - 6-character hex color
     */
    convertToHex6(hexColor) {
        // Convert 8-character hex color (with alpha) to 6-character hex for HTML color input
        if (hexColor && hexColor.length === 9 && hexColor.startsWith('#')) {
            // Remove the alpha channel (last 2 characters)
            return hexColor.substring(0, 7);
        }
        // Return as-is if it's already 6-character hex or invalid format
        return hexColor;
    }

    /**
     * Creates a SudokuPad URL from puzzle data
     * @param {Object} puzzleData - Puzzle data
     * @returns {string} - SudokuPad URL
     */
    createSudokuPadUrl(puzzleData) {
        try {
            // Convert puzzle data to compressed format using PuzzleZipper
            const compressedData = PuzzleZipper.zipPuzzle(puzzleData);
            
            // Create the full URL
            const baseUrl = 'https://sudokupad.app/';
            const fullUrl = `${baseUrl}?puzzle=${encodeURIComponent(compressedData)}`;
            
            return fullUrl;
            
        } catch (error) {
            console.error('Failed to create SudokuPad URL:', error);
            throw error;
        }
    }
}