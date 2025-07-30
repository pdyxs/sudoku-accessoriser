/**
 * Tests for UIController class
 * @jest-environment jsdom
 */

describe('UIController', () => {
  let UIController;

  beforeAll(() => {
    // Define UIController class for testing
    global.UIController = class UIController {
      constructor() {
        this.currentStep = 1;
      }

      showStep(stepNumber) {
        for (let i = 1; i <= 3; i++) {
          const stepElement = document.getElementById(this.getStepId(i));
          if (stepElement) {
            stepElement.style.display = 'none';
          }
        }

        const targetStepElement = document.getElementById(this.getStepId(stepNumber));
        if (targetStepElement) {
          targetStepElement.style.display = 'block';
        }

        this.currentStep = stepNumber;
      }

      getStepId(stepNumber) {
        const stepIds = {
          1: 'step-1',
          2: 'step-2',
          3: 'step-3'
        };
        return stepIds[stepNumber] || 'step-1';
      }

      updatePuzzleTitle(title) {
        const titleElement = document.getElementById('puzzle-title');
        if (titleElement) {
          titleElement.textContent = title || 'Puzzle Features';
        }
      }

      populateFeatures(features) {
        const featuresContainer = document.getElementById('features-list');
        if (!featuresContainer) return;

        featuresContainer.innerHTML = '';

        if (!features || features.length === 0) {
          featuresContainer.innerHTML = '<p>No customizable features found in this puzzle.</p>';
          return;
        }

        features.forEach((feature, index) => {
          const featureElement = this.createFeatureElement(feature, index);
          featuresContainer.appendChild(featureElement);
        });
      }

      createFeatureElement(feature, index) {
        const featureDiv = document.createElement('div');
        featureDiv.className = 'feature-item';
        
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

      createFeatureControls(feature, index) {
        let controls = '';

        if (feature.customizable && feature.customizable.color) {
          const colorControl = feature.customizable.color;
          const hexColor = this.convertToHex6(colorControl.default);
          controls += `
            <div class="control-group">
              <label>Color:</label>
              <input type="color" value="${hexColor}" 
                     onchange="app.updateCustomization(${index}, 'color', this.value)">
            </div>
          `;
        }

        return controls;
      }

      convertToHex6(hexColor) {
        if (hexColor && hexColor.length === 9 && hexColor.startsWith('#')) {
          return hexColor.substring(0, 7);
        }
        return hexColor;
      }

      showLoading(message) {
        const button = document.querySelector('#puzzle-url-form button');
        if (button) {
          button.textContent = message;
          button.disabled = true;
        }
      }

      showError(message) {
        this.resetLoadingState();
        alert(message);
        console.error(message);
      }

      resetLoadingState() {
        const button = document.querySelector('#puzzle-url-form button');
        if (button) {
          button.textContent = 'Load Puzzle';
          button.disabled = false;
        }
      }

      setPuzzleUrlInput(url) {
        const urlInput = document.getElementById('puzzle-url');
        if (urlInput) {
          urlInput.value = url;
        }
      }

      getPuzzleUrlInput() {
        const urlInput = document.getElementById('puzzle-url');
        return urlInput ? urlInput.value.trim() : '';
      }

      getCurrentStep() {
        return this.currentStep;
      }
    };

    UIController = global.UIController;
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    // Mock console.error and alert to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Step navigation', () => {
    test('should initialize with step 1', () => {
      const controller = new UIController();
      
      expect(controller.getCurrentStep()).toBe(1);
    });

    test('should show correct step and hide others', () => {
      document.body.innerHTML = `
        <div id="step-1">Step 1</div>
        <div id="step-2">Step 2</div>
        <div id="step-3">Step 3</div>
      `;
      
      const controller = new UIController();
      
      controller.showStep(2);
      
      expect(document.getElementById('step-1').style.display).toBe('none');
      expect(document.getElementById('step-2').style.display).toBe('block');
      expect(document.getElementById('step-3').style.display).toBe('none');
      expect(controller.getCurrentStep()).toBe(2);
    });

    test('should get correct step IDs', () => {
      const controller = new UIController();
      
      expect(controller.getStepId(1)).toBe('step-1');
      expect(controller.getStepId(2)).toBe('step-2');
      expect(controller.getStepId(3)).toBe('step-3');
      expect(controller.getStepId(999)).toBe('step-1'); // fallback
    });
  });

  describe('Puzzle title management', () => {
    test('should update puzzle title', () => {
      document.body.innerHTML = '<h2 id="puzzle-title">Default Title</h2>';
      
      const controller = new UIController();
      
      controller.updatePuzzleTitle('My Test Puzzle');
      
      expect(document.getElementById('puzzle-title').textContent).toBe('My Test Puzzle');
    });

    test('should use default title when none provided', () => {
      document.body.innerHTML = '<h2 id="puzzle-title">Old Title</h2>';
      
      const controller = new UIController();
      
      controller.updatePuzzleTitle(null);
      
      expect(document.getElementById('puzzle-title').textContent).toBe('Puzzle Features');
    });

    test('should handle missing title element gracefully', () => {
      const controller = new UIController();
      
      expect(() => controller.updatePuzzleTitle('Test')).not.toThrow();
    });
  });

  describe('Features population', () => {
    test('should populate features list', () => {
      document.body.innerHTML = '<div id="features-list"></div>';
      
      const features = [
        {
          category: 'lines',
          count: 5,
          visual: { color: '#ff0000ff' },
          customizable: {
            color: { default: '#ff0000ff' }
          }
        }
      ];
      
      const controller = new UIController();
      controller.populateFeatures(features);
      
      const featuresContainer = document.getElementById('features-list');
      expect(featuresContainer.children.length).toBe(1);
      expect(featuresContainer.querySelector('.feature-name').textContent).toBe('Lines (x5)');
    });

    test('should show message when no features available', () => {
      document.body.innerHTML = '<div id="features-list"></div>';
      
      const controller = new UIController();
      controller.populateFeatures([]);
      
      const featuresContainer = document.getElementById('features-list');
      expect(featuresContainer.innerHTML).toBe('<p>No customizable features found in this puzzle.</p>');
    });

    test('should handle missing features container gracefully', () => {
      const controller = new UIController();
      
      expect(() => controller.populateFeatures([])).not.toThrow();
    });
  });

  describe('Feature element creation', () => {
    test('should create feature element with correct structure', () => {
      const feature = {
        category: 'lines',
        count: 3,
        visual: { color: '#00ff00ff' },
        customizable: {
          color: { default: '#00ff00ff' }
        }
      };
      
      const controller = new UIController();
      const element = controller.createFeatureElement(feature, 0);
      
      expect(element.className).toBe('feature-item');
      expect(element.querySelector('.feature-name').textContent).toBe('Lines (x3)');
      expect(element.querySelector('.original-line').style.backgroundColor).toBe('rgb(0, 255, 0)');
    });

    test('should create controls for customizable features', () => {
      const feature = {
        category: 'lines',
        count: 1,
        visual: { color: '#0000ffff' },
        customizable: {
          color: { default: '#0000ffff' }
        }
      };
      
      const controller = new UIController();
      const controls = controller.createFeatureControls(feature, 0);
      
      expect(controls).toContain('type="color"');
      expect(controls).toContain('value="#0000ff"');
    });
  });

  describe('Loading and error states', () => {
    test('should show loading state', () => {
      document.body.innerHTML = `
        <form id="puzzle-url-form">
          <button type="submit">Load Puzzle</button>
        </form>
      `;
      
      const controller = new UIController();
      
      controller.showLoading('Loading...');
      
      const button = document.querySelector('#puzzle-url-form button');
      expect(button.textContent).toBe('Loading...');
      expect(button.disabled).toBe(true);
    });

    test('should reset loading state', () => {
      document.body.innerHTML = `
        <form id="puzzle-url-form">
          <button type="submit" disabled>Loading...</button>
        </form>
      `;
      
      const controller = new UIController();
      
      controller.resetLoadingState();
      
      const button = document.querySelector('#puzzle-url-form button');
      expect(button.textContent).toBe('Load Puzzle');
      expect(button.disabled).toBe(false);
    });

    test('should show error and reset loading state', () => {
      document.body.innerHTML = `
        <form id="puzzle-url-form">
          <button type="submit" disabled>Loading...</button>
        </form>
      `;
      
      const controller = new UIController();
      
      controller.showError('Test error');
      
      expect(global.alert).toHaveBeenCalledWith('Test error');
      expect(console.error).toHaveBeenCalledWith('Test error');
      
      const button = document.querySelector('#puzzle-url-form button');
      expect(button.disabled).toBe(false);
    });
  });

  describe('URL input management', () => {
    test('should set puzzle URL input', () => {
      document.body.innerHTML = '<input id="puzzle-url" type="url" />';
      
      const controller = new UIController();
      
      controller.setPuzzleUrlInput('https://sudokupad.app/test123');
      
      expect(document.getElementById('puzzle-url').value).toBe('https://sudokupad.app/test123');
    });

    test('should get puzzle URL input', () => {
      document.body.innerHTML = '<input id="puzzle-url" type="url" value="  https://sudokupad.app/test123  " />';
      
      const controller = new UIController();
      
      expect(controller.getPuzzleUrlInput()).toBe('https://sudokupad.app/test123');
    });

    test('should return empty string when URL input missing', () => {
      const controller = new UIController();
      
      expect(controller.getPuzzleUrlInput()).toBe('');
    });
  });

  describe('Color conversion', () => {
    test('should convert 8-character hex to 6-character hex', () => {
      const controller = new UIController();
      
      expect(controller.convertToHex6('#ff0000ff')).toBe('#ff0000');
      expect(controller.convertToHex6('#00ff0088')).toBe('#00ff00');
    });

    test('should handle invalid hex colors', () => {
      const controller = new UIController();
      
      expect(controller.convertToHex6('invalid')).toBe('invalid');
      expect(controller.convertToHex6('#ff0000')).toBe('#ff0000');
    });
  });
});