/**
 * UIController - Handles DOM manipulation and user interface updates
 * Extracted from SudokuAccessoriser for better separation of concerns
 */
class UIController {
  constructor() {
    this.currentStep = 1;
    this.loadingToastId = null; // Track loading toast
  }

  /**
   * Shows a specific step and hides others
   * @param {number} stepNumber - Step number to show (1, 2, or 3)
   */
  showStep(stepNumber) {
    // Hide all steps using existing CSS classes
    document.querySelectorAll('.step').forEach(step => {
      step.classList.add('hidden');
    });

    // Show the requested step
    const targetStepElement = document.getElementById(
      this.getStepId(stepNumber)
    );
    if (targetStepElement) {
      targetStepElement.classList.remove('hidden');
    }

    this.currentStep = stepNumber;
  }

  /**
   * Gets the DOM ID for a step number
   * @param {number} stepNumber - Step number
   * @returns {string} - DOM element ID
   */
  getStepId(stepNumber) {
    const stepIds = {
      1: 'url-input-section',
      2: 'features-section',
      3: 'preview-section',
    };
    return stepIds[stepNumber] || 'url-input-section';
  }

  /**
   * Updates the puzzle title in the UI
   * @param {string} title - Puzzle title
   */
  updatePuzzleTitle(title) {
    const titleElement = document.getElementById('puzzle-title');
    if (titleElement) {
      titleElement.textContent = title || 'Puzzle Features';
    }
  }

  /**
   * Populates the features list in the UI
   * @param {Array} features - Array of feature objects
   */
  populateFeatures(features) {
    const featuresContainer = document.getElementById('features-list');
    if (!featuresContainer) {
      return;
    }

    featuresContainer.innerHTML = '';

    if (!features || features.length === 0) {
      featuresContainer.innerHTML =
        '<p>No customizable features found in this puzzle.</p>';
      return;
    }

    features.forEach((feature, index) => {
      const featureElement = this.createFeatureElement(feature, index);
      featuresContainer.appendChild(featureElement);
    });
  }

  /**
   * Creates a DOM element for a feature
   * @param {Object} feature - Feature object
   * @param {number} index - Feature index
   * @returns {HTMLElement} - Feature DOM element
   */
  createFeatureElement(feature, index) {
    const featureDiv = document.createElement('div');
    featureDiv.className = 'feature-item';

    // Create a display name for the feature based on its properties
    const displayName = `${feature.category.charAt(0).toUpperCase() + feature.category.slice(1)} (x${feature.count})`;
    const color = feature.visual.color;

    featureDiv.innerHTML = `
            <div class="feature-header">
                <span class="feature-name">${displayName}</span>
                <div class="color-previews">
                    <div class="color-preview-group">
                        <div class="feature-preview original-preview" title="Original line">
                            <div class="line-preview original-line" style="background-color: ${color}"></div>
                        </div>
                        <span class="color-label">Original</span>
                    </div>
                    <div class="color-preview-group">
                        <div class="feature-preview new-preview" title="New line">
                            <div class="line-preview new-line" style="background-color: ${color}"></div>
                        </div>
                        <span class="color-label">New</span>
                    </div>
                </div>
            </div>
            <div class="feature-controls">
                ${this.createFeatureControls(feature, index)}
            </div>
        `;

    return featureDiv;
  }

  /**
   * Creates control elements for a feature
   * @param {Object} feature - Feature object
   * @param {number} index - Feature index
   * @returns {string} - HTML string for controls
   */
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
   * Shows loading state with a message
   * @param {string} message - Loading message
   */
  showLoading(message) {
    // Update button state
    const button = document.querySelector('#puzzle-url-form button');
    if (button) {
      button.classList.add('button-loading');
      button.disabled = true;
    }

    // Show simple loading overlay with spinner (no progress bar)
    if (window.notificationManager) {
      window.notificationManager.showLoadingOverlay('Loading', message, false);
    }
  }

  /**
   * Shows error message to user
   * @param {string} message - Error message
   */
  showError(message) {
    // Reset loading state first
    this.resetLoadingState();

    // Show error toast instead of alert
    if (window.notificationManager) {
      window.notificationManager.showError(message);
    } else {
      // Fallback to alert if notification manager not available
      alert(message);
    }
    console.error(message);
  }

  /**
   * Shows success message to user
   * @param {string} message - Success message
   */
  showSuccess(message) {
    if (window.notificationManager) {
      window.notificationManager.showSuccess(message);
    }
    console.log(message);
  }

  /**
   * Shows warning message to user
   * @param {string} message - Warning message
   */
  showWarning(message) {
    if (window.notificationManager) {
      window.notificationManager.showWarning(message);
    }
    console.warn(message);
  }

  /**
   * Shows info message to user
   * @param {string} message - Info message
   */
  showInfo(message) {
    if (window.notificationManager) {
      window.notificationManager.showInfo(message);
    }
    console.info(message);
  }

  /**
   * Resets the loading state of UI elements
   */
  resetLoadingState() {
    const button = document.querySelector('#puzzle-url-form button');
    if (button) {
      button.classList.remove('button-loading');
      button.disabled = false;
    }

    // Hide loading overlay
    if (window.notificationManager) {
      window.notificationManager.hideLoadingOverlay();
    }
  }

  /**
   * Sets the value of the puzzle URL input
   * @param {string} url - URL to set
   */
  setPuzzleUrlInput(url) {
    const urlInput = document.getElementById('puzzle-url');
    if (urlInput) {
      urlInput.value = url;
    }
  }

  /**
   * Gets the value of the puzzle URL input
   * @returns {string} - Current URL input value
   */
  getPuzzleUrlInput() {
    const urlInput = document.getElementById('puzzle-url');
    return urlInput ? urlInput.value.trim() : '';
  }

  /**
   * Gets the current step number
   * @returns {number} - Current step number
   */
  getCurrentStep() {
    return this.currentStep;
  }
}
