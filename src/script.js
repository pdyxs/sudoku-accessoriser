class SudokuAccessoriser {
    constructor() {
        this.currentStep = 1;
        this.puzzleData = null;
        this.customizations = {};
        
        this.initializeTheme();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // URL form submission
        const urlForm = document.getElementById('puzzle-url-form');
        urlForm.addEventListener('submit', (e) => this.handleUrlSubmit(e));

        // Navigation buttons
        document.getElementById('back-to-url').addEventListener('click', () => this.showStep(1));
        document.getElementById('preview-puzzle').addEventListener('click', () => this.openCustomizedPuzzle());
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
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
        } catch (error) {
            this.showError('Failed to load puzzle data: ' + error.message);
        }
    }

    isValidSudokuPadUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === 'sudokupad.app' || 
                   urlObj.hostname === 'www.sudokupad.app';
        } catch {
            return false;
        }
    }

    async extractPuzzleData(puzzleUrl) {
        // Stub implementation - this will be replaced with actual data extraction
        console.log('Extracting data from:', puzzleUrl);
        await this.delay(1000); // Simulate network delay
        
        return {
            title: "Sample Puzzle",
            features: [
                {
                    type: "line",
                    name: "Thermometer Lines",
                    color: "#ff6b6b",
                    count: 3,
                    customizable: ["color", "style", "thickness"]
                },
                {
                    type: "region",
                    name: "Killer Cages",
                    color: "#4ecdc4",
                    count: 8,
                    customizable: ["color", "opacity", "border"]
                },
                {
                    type: "arrow",
                    name: "Direction Arrows",
                    color: "#45b7d1",
                    count: 5,
                    customizable: ["color", "size", "style"]
                },
                {
                    type: "circle",
                    name: "Constraint Circles",
                    color: "#96ceb4",
                    count: 12,
                    customizable: ["color", "size", "fill"]
                }
            ]
        };
    }

    populateFeatures() {
        // Update the title to show the puzzle name
        const titleElement = document.getElementById('puzzle-title');
        titleElement.textContent = this.puzzleData.title || 'Puzzle Features';

        const featuresContainer = document.getElementById('features-list');
        featuresContainer.innerHTML = '';

        if (!this.puzzleData || !this.puzzleData.features) {
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
        featureDiv.innerHTML = `
            <div class="feature-header">
                <span class="feature-name">${feature.name} (${feature.count})</span>
                <div class="feature-preview" style="background-color: ${feature.color}"></div>
            </div>
            <div class="feature-controls">
                ${this.createFeatureControls(feature, index)}
            </div>
        `;

        return featureDiv;
    }

    createFeatureControls(feature, index) {
        let controls = '';

        if (feature.customizable.includes('color')) {
            controls += `
                <div class="control-group">
                    <label>Color:</label>
                    <input type="color" value="${feature.color}" 
                           onchange="app.updateCustomization(${index}, 'color', this.value)">
                </div>
            `;
        }

        if (feature.customizable.includes('style')) {
            controls += `
                <div class="control-group">
                    <label>Style:</label>
                    <select onchange="app.updateCustomization(${index}, 'style', this.value)">
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="hollow">Hollow</option>
                    </select>
                </div>
            `;
        }

        if (feature.customizable.includes('thickness') || feature.customizable.includes('size')) {
            const label = feature.customizable.includes('thickness') ? 'Thickness' : 'Size';
            controls += `
                <div class="control-group">
                    <label>${label}:</label>
                    <input type="range" min="1" max="10" value="5" 
                           onchange="app.updateCustomization(${index}, '${label.toLowerCase()}', this.value)">
                </div>
            `;
        }

        if (feature.customizable.includes('opacity')) {
            controls += `
                <div class="control-group">
                    <label>Opacity:</label>
                    <input type="range" min="0" max="100" value="100" 
                           onchange="app.updateCustomization(${index}, 'opacity', this.value)">
                </div>
            `;
        }

        if (feature.customizable.includes('text')) {
            controls += `
                <div class="control-group">
                    <label>Text:</label>
                    <input type="text" placeholder="Add annotation..." 
                           onchange="app.updateCustomization(${index}, 'text', this.value)">
                </div>
            `;
        }

        return controls;
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