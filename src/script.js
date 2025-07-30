class SudokuAccessoriser {
    constructor() {
        this.puzzleData = null;
        
        // Initialize component classes
        this.puzzleLoader = new PuzzleLoader();
        this.featureManager = new FeatureManager();
        this.uiController = new UIController();
        this.themeManager = new ThemeManager();
        
        this.initializeEventListeners();
        this.checkForPuzzleParameter();
    }

    initializeEventListeners() {
        // URL form submission
        const urlForm = document.getElementById('puzzle-url-form');
        urlForm.addEventListener('submit', (e) => this.handleUrlSubmit(e));

        // Navigation buttons
        document.getElementById('back-to-url').addEventListener('click', () => this.goBackToUrl());
        document.getElementById('preview-puzzle').addEventListener('click', () => this.openCustomizedPuzzle());
        document.getElementById('open-puzzle').addEventListener('click', () => this.openCustomizedPuzzle());
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.themeManager.toggleTheme());
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => this.handlePopState());
    }

    async handleUrlSubmit(e) {
        e.preventDefault();
        
        const puzzleUrl = this.uiController.getPuzzleUrlInput();
        
        if (!puzzleUrl) {
            this.uiController.showError('Please enter a puzzle URL');
            return;
        }

        if (!this.puzzleLoader.isValidSudokuPadUrl(puzzleUrl)) {
            this.uiController.showError('Please enter a valid SudokuPad URL');
            return;
        }

        try {
            this.uiController.showLoading('Loading puzzle data...');
            this.puzzleData = await this.puzzleLoader.extractPuzzleData(puzzleUrl);
            this.populateFeatures();
            this.uiController.showStep(2);
            
            // Update URL parameter to reflect current puzzle
            this.puzzleLoader.updateUrlParameter('puzzle', this.puzzleLoader.extractPuzzleIdFromUrl(puzzleUrl));
            
        } catch (error) {
            this.uiController.showError('Failed to load puzzle data: ' + error.message);
        }
    }

    // Methods removed - now handled by PuzzleLoader class

    populateFeatures() {
        // Update the title to show the puzzle name
        this.uiController.updatePuzzleTitle(this.puzzleData.title);
        
        // Populate features using UIController
        this.uiController.populateFeatures(this.puzzleData.features);
    }

    // Method removed - now handled by UIController class

    // Method removed - now handled by UIController class

    // Method removed - now handled by UIController and FeatureManager classes

    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    async checkForPuzzleParameter() {
        const puzzleParam = this.getUrlParameter('puzzle');
        
        if (puzzleParam) {
            console.log('Found puzzle parameter:', puzzleParam);
            
            // Convert parameter to full URL if it's just an ID
            const puzzleUrl = this.normalizePuzzleUrl(puzzleParam);
            
            // Pre-populate the URL input
            const urlInput = document.getElementById('puzzle-url');
            if (urlInput) {
                urlInput.value = puzzleUrl;
            }
            
            // Auto-load the puzzle
            await this.autoLoadPuzzle(puzzleUrl);
        }
    }

    normalizePuzzleUrl(puzzleParam) {
        // If it's already a full URL, return as-is
        if (puzzleParam.startsWith('http://') || puzzleParam.startsWith('https://')) {
            return puzzleParam;
        }
        
        // If it contains a slash, it might be a custom URL like "pdyxs/whispers-in-the-mist"
        if (puzzleParam.includes('/')) {
            return `https://sudokupad.app/${puzzleParam}`;
        }
        
        // Otherwise, treat it as a simple puzzle ID
        return `https://sudokupad.app/${puzzleParam}`;
    }

    async autoLoadPuzzle(puzzleUrl) {
        if (!this.isValidSudokuPadUrl(puzzleUrl)) {
            console.error('Invalid puzzle URL from parameter:', puzzleUrl);
            this.showError('Invalid puzzle URL in link parameter');
            return;
        }

        try {
            this.showLoading('Loading puzzle from URL parameter...');
            this.puzzleData = await this.extractPuzzleData(puzzleUrl);
            this.populateFeatures();
            this.showStep(2);
            
            // Update URL to reflect current state
            this.updateUrlParameter('puzzle', this.extractPuzzleIdFromUrl(puzzleUrl));
            
        } catch (error) {
            console.error('Failed to auto-load puzzle:', error);
            this.showError('Failed to load puzzle from URL parameter: ' + error.message);
        }
    }

    extractPuzzleIdFromUrl(url) {
        // Extract just the puzzle ID part for cleaner URL parameters
        return PuzzleConverter.extractPuzzleId(url) || url;
    }

    updateUrlParameter(name, value) {
        const url = new URL(window.location);
        if (value) {
            url.searchParams.set(name, value);
        } else {
            url.searchParams.delete(name);
        }
        window.history.pushState({}, '', url);
    }

    handlePopState() {
        // Handle browser back/forward button navigation
        const puzzleParam = this.getUrlParameter('puzzle');
        
        if (puzzleParam && !this.puzzleData) {
            // URL has puzzle parameter but no puzzle loaded - auto-load it
            this.checkForPuzzleParameter();
        } else if (!puzzleParam && this.puzzleData) {
            // No puzzle parameter but puzzle is loaded - go back to step 1
            this.puzzleData = null;
            this.resetLoadingState(); // Clear any loading state
            this.showStep(1);
        }
    }

    goBackToUrl() {
        // Clear puzzle data and URL parameter, return to step 1
        this.puzzleData = null;
        this.customizations = {};
        this.updateUrlParameter('puzzle', null); // Remove puzzle parameter
        this.resetLoadingState(); // Clear any loading state
        this.showStep(1);
    }

    updateCustomization(featureIndex, property, value) {
        if (!this.customizations[featureIndex]) {
            this.customizations[featureIndex] = {};
        }
        this.customizations[featureIndex][property] = value;

        // Update the new line preview if it's a color change
        if (property === 'color') {
            const featureItems = document.querySelectorAll('.feature-item');
            const newLinePreview = featureItems[featureIndex].querySelector('.new-line');
            if (newLinePreview) {
                newLinePreview.style.backgroundColor = value;
            }
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.add('hidden');
        });

        // Show the requested step
        const stepElement = document.getElementById(this.getStepId(stepNumber));
        if (stepElement) {
            stepElement.classList.remove('hidden');
            this.currentStep = stepNumber;
        }
    }

    getStepId(stepNumber) {
        const stepIds = {
            1: 'url-input-section',
            2: 'features-section',
            3: 'preview-section'
        };
        return stepIds[stepNumber];
    }

    openCustomizedPuzzle() {
        try {
            console.log('Opening customized puzzle...');
            const customizedUrl = this.generateCustomizedPuzzleUrl();
            
            if (customizedUrl) {
                console.log('Generated customized URL:', customizedUrl);
                window.open(customizedUrl, '_blank');
            } else {
                this.showError('Failed to generate customized puzzle URL');
            }
        } catch (error) {
            console.error('Error opening customized puzzle:', error);
            this.showError('Failed to open customized puzzle: ' + error.message);
        }
    }

    generateCustomizedPuzzleUrl() {
        if (!this.puzzleData || !this.puzzleData.originalData) {
            console.error('No puzzle data available for customization');
            return null;
        }

        console.log('Generating customized puzzle with:', this.customizations);
        
        try {
            // Create a deep copy of the original puzzle data
            const customizedPuzzle = JSON.parse(JSON.stringify(this.puzzleData.originalData));
            
            // Apply customizations to the puzzle data
            this.applyCustomizations(customizedPuzzle);
            
            // Generate a new SudokuPad URL with the customized puzzle
            return this.createSudokuPadUrl(customizedPuzzle);
            
        } catch (error) {
            console.error('Failed to generate customized puzzle:', error);
            return null;
        }
    }

    applyCustomizations(puzzleData) {
        console.log('Applying customizations:', this.customizations);
        console.log('Original puzzle lines count:', puzzleData.lines.length);
        
        // Apply customizations to each feature group
        Object.keys(this.customizations).forEach(featureIndex => {
            const customization = this.customizations[featureIndex];
            const feature = this.puzzleData.features[parseInt(featureIndex)];
            
            console.log(`Processing feature ${featureIndex}:`, { customization, feature: feature ? feature.category : 'undefined' });
            
            if (!feature || feature.category !== 'lines') {
                console.log(`Skipping feature ${featureIndex} - not a line feature`);
                return; // Skip non-line features for now
            }
            
            // Apply color customization to all lines in this feature group
            if (customization.color) {
                console.log(`Applying color ${customization.color} to ${feature.lines.length} lines`);
                
                let matchedCount = 0;
                feature.lines.forEach((line, lineIndex) => {
                    // Find the corresponding line in the puzzle data and update its color
                    const puzzleLine = puzzleData.lines.find(pLine => 
                        this.areLinesEqual(pLine, line)
                    );
                    if (puzzleLine) {
                        console.log(`Found matching line ${lineIndex}, updating color from ${puzzleLine.color} to ${this.convertToHex8(customization.color)}`);
                        // Convert 6-character hex back to 8-character hex with alpha
                        puzzleLine.color = this.convertToHex8(customization.color);
                        matchedCount++;
                    } else {
                        console.warn(`Could not find matching line for feature ${featureIndex}, line ${lineIndex}:`, line);
                    }
                });
                
                console.log(`Successfully matched and updated ${matchedCount} out of ${feature.lines.length} lines`);
            }
        });
        
        console.log('Customizations applied. Updated puzzle lines:', puzzleData.lines.map(l => l.color));
    }
    
    areLinesEqual(line1, line2) {
        // Compare lines by their defining properties to identify the same line
        
        // If both have wayPoints, compare those
        if (line1.wayPoints && line2.wayPoints) {
            if (line1.wayPoints.length !== line2.wayPoints.length) {
                return false;
            }
            
            const areEqual = line1.wayPoints.every((point, index) => {
                const otherPoint = line2.wayPoints[index];
                return point[0] === otherPoint[0] && point[1] === otherPoint[1];
            });
            return areEqual;
        }
        
        // If both have SVG path data (d attribute), compare those
        if (line1.d && line2.d) {
            return line1.d === line2.d;
        }
        
        // If one has wayPoints and the other has d, they're different types
        if ((line1.wayPoints && line2.d) || (line1.d && line2.wayPoints)) {
            return false;
        }
        
        // If neither has wayPoints nor d, they might be equal if other properties match
        // This is a fallback - we'll compare color and thickness as identifiers
        const result = line1.color === line2.color && 
                      line1.thickness === line2.thickness &&
                      JSON.stringify(line1) === JSON.stringify(line2);
        return result;
    }
    
    convertToHex8(hex6Color) {
        // Convert 6-character hex color back to 8-character hex with full opacity
        if (hex6Color && hex6Color.length === 7 && hex6Color.startsWith('#')) {
            return hex6Color + 'ff'; // Add full opacity
        }
        return hex6Color;
    }

    createSudokuPadUrl(puzzleData) {
        try {
            // Use PuzzleConverter utilities to compress and encode the puzzle
            const compressedData = PuzzleZipper.zip(JSON.stringify(puzzleData));
            const encodedData = loadFPuzzle.compressPuzzle(compressedData);
            
            // Create SCL format puzzle ID
            const sclPuzzleId = 'scl' + encodedData;
            
            // Generate SudokuPad URL using SCF format with puzzleid parameter
            return `https://sudokupad.app/scf?puzzleid=${encodeURIComponent(sclPuzzleId)}`;
            
        } catch (error) {
            console.error('Failed to create SudokuPad URL:', error);
            throw error;
        }
    }

    // Methods removed - now handled by UIController class

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Methods removed - now handled by ThemeManager class
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SudokuAccessoriser();
});