class SudokuAccessoriser {
    constructor() {
        this.currentStep = 1;
        this.puzzleData = null;
        this.customizations = {};
        
        this.initializeTheme();
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
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => this.handlePopState());
    }

    async handleUrlSubmit(e) {
        e.preventDefault();
        
        const urlInput = document.getElementById('puzzle-url');
        const puzzleUrl = urlInput.value.trim();
        
        if (!puzzleUrl) {
            this.showError('Please enter a puzzle URL');
            return;
        }

        if (!this.isValidSudokuPadUrl(puzzleUrl)) {
            this.showError('Please enter a valid SudokuPad URL');
            return;
        }

        try {
            this.showLoading('Loading puzzle data...');
            this.puzzleData = await this.extractPuzzleData(puzzleUrl);
            this.populateFeatures();
            this.showStep(2);
            
            // Update URL parameter to reflect current puzzle
            this.updateUrlParameter('puzzle', this.extractPuzzleIdFromUrl(puzzleUrl));
            
        } catch (error) {
            this.showError('Failed to load puzzle data: ' + error.message);
        }
    }

    isValidSudokuPadUrl(url) {
        // Use PuzzleConverter's validation which handles more URL formats
        return PuzzleConverter.isValidSudokuPadUrl(url);
    }

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

    populateFeatures() {
        // Update the title to show the puzzle name
        const titleElement = document.getElementById('puzzle-title');
        titleElement.textContent = this.puzzleData.title || 'Puzzle Features';

        const featuresContainer = document.getElementById('features-list');
        featuresContainer.innerHTML = '';

        if (!this.puzzleData || !this.puzzleData.features || this.puzzleData.features.length === 0) {
            featuresContainer.innerHTML = '<p>No customizable features found in this puzzle.</p>';
            return;
        }

        this.puzzleData.features.forEach((feature, index) => {
            const featureElement = this.createFeatureElement(feature, index);
            featuresContainer.appendChild(featureElement);
        });
    }

    createFeatureElement(feature, index) {
        const featureDiv = document.createElement('div');
        featureDiv.className = 'feature-item';
        
        // Create a display name for the feature based on its properties
        const displayName = `${feature.category.charAt(0).toUpperCase() + feature.category.slice(1)} (x${feature.count})`;
        const color = feature.visual.color;
        
        featureDiv.innerHTML = `
            <div class="feature-header">
                <span class="feature-name">${displayName}</span>
                <div class="feature-preview" style="background-color: ${color}"></div>
            </div>
            <div class="feature-controls">
                ${this.createFeatureControls(feature, index)}
            </div>
        `;

        return featureDiv;
    }

    createFeatureControls(feature, index) {
        let controls = '';

        // Our new feature format has customizable as an object
        if (feature.customizable && feature.customizable.color) {
            const colorControl = feature.customizable.color;
            // Convert 8-character hex (with alpha) to 6-character hex for HTML color input
            const hexColor = this.convertToHex6(colorControl.default);
            controls += `
                <div class="control-group">
                    <label>Color:</label>
                    <input type="color" value="${hexColor}" 
                           onchange="app.updateCustomization(${index}, 'color', this.value)">
                </div>
            `;
        }

        // For now, we only support color customization for lines
        // Additional controls can be added later

        return controls;
    }

    convertToHex6(hexColor) {
        // Convert 8-character hex color (with alpha) to 6-character hex for HTML color input
        if (hexColor && hexColor.length === 9 && hexColor.startsWith('#')) {
            // Remove the alpha channel (last 2 characters)
            return hexColor.substring(0, 7);
        }
        // Return as-is if it's already 6-character hex or invalid format
        return hexColor;
    }

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

        // Update the preview color if it's a color change
        if (property === 'color') {
            const featureItems = document.querySelectorAll('.feature-item');
            const preview = featureItems[featureIndex].querySelector('.feature-preview');
            preview.style.backgroundColor = value;
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
        // Stub implementation - this will generate the actual customized puzzle URL
        const customizedUrl = this.generateCustomizedPuzzleUrl();
        window.open(customizedUrl, '_blank');
    }

    generateCustomizedPuzzleUrl() {
        // Stub implementation - this will be replaced with actual URL generation
        const originalUrl = document.getElementById('puzzle-url').value;
        console.log('Generating customized puzzle with:', this.customizations);
        
        // For now, just return the original URL with a parameter
        return originalUrl + '&customized=true';
    }

    showLoading(message) {
        // Simple loading implementation
        const button = document.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = message;
    }

    showError(message) {
        alert(message); // Simple error handling for now
        
        // Re-enable the submit button
        const button = document.querySelector('button[type="submit"]');
        button.disabled = false;
        button.textContent = 'Load Puzzle';
    }

    resetLoadingState() {
        // Reset the submit button to its normal state
        const button = document.querySelector('button[type="submit"]');
        if (button) {
            button.disabled = false;
            button.textContent = 'Load Puzzle';
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    initializeTheme() {
        // Check for saved theme preference or default to browser preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(theme);
        
        // Listen for browser theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SudokuAccessoriser();
});