/**
 * ValidationManager - Handles real-time input validation and feedback
 */
class ValidationManager {
    constructor() {
        this.validators = new Map();
        this.debounceTimeouts = new Map();
        this.validationDelay = 500; // ms
    }

    /**
     * Registers a validator for an input element
     * @param {string} inputId - Input element ID
     * @param {Function} validatorFn - Validation function
     * @param {Object} options - Validation options
     */
    registerValidator(inputId, validatorFn, options = {}) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const config = {
            validator: validatorFn,
            feedbackElement: document.getElementById(options.feedbackId || `${inputId}-feedback`),
            iconElement: document.getElementById(options.iconId || 'validation-icon'),
            validateOnInput: options.validateOnInput !== false,
            validateOnBlur: options.validateOnBlur !== false,
            showSuccess: options.showSuccess !== false,
            ...options
        };

        this.validators.set(inputId, config);

        // Add event listeners
        if (config.validateOnInput) {
            input.addEventListener('input', (e) => this.handleInput(inputId, e));
        }
        
        if (config.validateOnBlur) {
            input.addEventListener('blur', (e) => this.handleBlur(inputId, e));
        }

        // Initial validation if input has value
        if (input.value.trim()) {
            this.validateInput(inputId);
        }
    }

    /**
     * Handles input events with debouncing
     * @param {string} inputId - Input element ID
     * @param {Event} event - Input event
     */
    handleInput(inputId, event) {
        // Clear previous timeout
        if (this.debounceTimeouts.has(inputId)) {
            clearTimeout(this.debounceTimeouts.get(inputId));
        }

        // Set validation state to "validating"
        this.setValidationState(inputId, 'validating', 'Checking...');

        // Debounce validation
        const timeout = setTimeout(() => {
            this.validateInput(inputId);
            this.debounceTimeouts.delete(inputId);
        }, this.validationDelay);

        this.debounceTimeouts.set(inputId, timeout);
    }

    /**
     * Handles blur events (immediate validation)
     * @param {string} inputId - Input element ID
     * @param {Event} event - Blur event
     */
    handleBlur(inputId, event) {
        // Clear debounce timeout and validate immediately
        if (this.debounceTimeouts.has(inputId)) {
            clearTimeout(this.debounceTimeouts.get(inputId));
            this.debounceTimeouts.delete(inputId);
        }

        this.validateInput(inputId);
    }

    /**
     * Validates an input and updates UI
     * @param {string} inputId - Input element ID
     * @returns {Promise<boolean>} - Validation result
     */
    async validateInput(inputId) {
        const config = this.validators.get(inputId);
        const input = document.getElementById(inputId);
        
        if (!config || !input) return false;

        const value = input.value.trim();

        try {
            // Show validating state for async operations
            if (config.validator.constructor.name === 'AsyncFunction') {
                this.setValidationState(inputId, 'validating', 'Validating...');
            }

            const result = await config.validator(value, input);
            
            if (result.isValid) {
                if (config.showSuccess) {
                    this.setValidationState(inputId, 'valid', result.message || 'Valid');
                } else {
                    this.clearValidation(inputId);
                }
                return true;
            } else {
                this.setValidationState(inputId, 'invalid', result.message || 'Invalid input');
                return false;
            }
        } catch (error) {
            console.error('Validation error:', error);
            this.setValidationState(inputId, 'invalid', 'Validation failed');
            return false;
        }
    }

    /**
     * Sets the validation state of an input
     * @param {string} inputId - Input element ID
     * @param {string} state - Validation state (valid, invalid, validating)
     * @param {string} message - Feedback message
     */
    setValidationState(inputId, state, message) {
        const input = document.getElementById(inputId);
        const config = this.validators.get(inputId);
        
        if (!input || !config) return;

        // Update input classes
        input.classList.remove('valid', 'invalid', 'validating');
        input.classList.add(state);

        // Update feedback message
        if (config.feedbackElement) {
            config.feedbackElement.textContent = message;
            config.feedbackElement.className = `input-feedback ${state}`;
        }

        // Update validation icon
        if (config.iconElement) {
            config.iconElement.classList.remove('success', 'error', 'validating', 'show');
            
            let iconText = '';
            switch (state) {
                case 'valid':
                    iconText = '✓';
                    config.iconElement.classList.add('success', 'show');
                    break;
                case 'invalid':
                    iconText = '✗';
                    config.iconElement.classList.add('error', 'show');
                    break;
                case 'validating':
                    iconText = '⟳';
                    config.iconElement.classList.add('validating', 'show');
                    break;
            }
            config.iconElement.textContent = iconText;
        }
    }

    /**
     * Clears validation state
     * @param {string} inputId - Input element ID
     */
    clearValidation(inputId) {
        const input = document.getElementById(inputId);
        const config = this.validators.get(inputId);
        
        if (!input || !config) return;

        input.classList.remove('valid', 'invalid', 'validating');
        
        if (config.feedbackElement) {
            config.feedbackElement.textContent = '';
            config.feedbackElement.className = 'input-feedback';
        }

        if (config.iconElement) {
            config.iconElement.classList.remove('success', 'error', 'validating', 'show');
            config.iconElement.textContent = '';
        }
    }

    /**
     * Validates all registered inputs
     * @returns {Promise<boolean>} - True if all inputs are valid
     */
    async validateAll() {
        const validationPromises = Array.from(this.validators.keys()).map(
            inputId => this.validateInput(inputId)
        );

        const results = await Promise.all(validationPromises);
        return results.every(result => result === true);
    }

    /**
     * Creates a URL validator for SudokuPad URLs
     * @returns {Function} - URL validator function
     */
    createSudokuPadUrlValidator() {
        return async (value) => {
            if (!value) {
                return { isValid: false, message: 'Please enter a URL' };
            }

            // Basic URL format check
            let url;
            try {
                url = new URL(value);
            } catch {
                return { isValid: false, message: 'Please enter a valid URL' };
            }

            // Check if it's a SudokuPad domain
            const validDomains = ['sudokupad.app', 'www.sudokupad.app'];
            if (!validDomains.includes(url.hostname)) {
                return { 
                    isValid: false, 
                    message: 'Please enter a SudokuPad URL (sudokupad.app)'
                };
            }

            // Check that there's actually a puzzle ID in the path
            const path = url.pathname;
            
            // Remove leading slash and check if there's content
            const pathContent = path.replace(/^\/+/, '');
            
            if (!pathContent) {
                return {
                    isValid: false,
                    message: 'URL must include a puzzle ID (e.g., https://sudokupad.app/abc123)'
                };
            }

            // Check for common invalid paths
            const invalidPaths = ['', '/', '/app', '/puzzles', '/create', '/settings'];
            if (invalidPaths.includes(path) || invalidPaths.includes('/' + pathContent)) {
                return {
                    isValid: false,
                    message: 'URL must include a puzzle ID (e.g., https://sudokupad.app/abc123)'
                };
            }

            // Additional validation using PuzzleConverter if available
            if (window.PuzzleConverter && window.PuzzleConverter.isValidSudokuPadUrl) {
                if (!window.PuzzleConverter.isValidSudokuPadUrl(value)) {
                    return { 
                        isValid: false, 
                        message: 'Please enter a valid SudokuPad puzzle URL'
                    };
                }
            }

            // Try to extract puzzle ID to verify it exists
            if (window.PuzzleConverter && window.PuzzleConverter.extractPuzzleId) {
                const puzzleId = window.PuzzleConverter.extractPuzzleId(value);
                if (!puzzleId || puzzleId.trim() === '') {
                    return {
                        isValid: false,
                        message: 'Could not find a puzzle ID in this URL'
                    };
                }
            }

            // Simulate async validation
            await new Promise(resolve => setTimeout(resolve, 300));

            return { 
                isValid: true, 
                message: 'Valid SudokuPad puzzle URL'
            };
        };
    }

    /**
     * Gets validation state of an input
     * @param {string} inputId - Input element ID
     * @returns {string|null} - Current validation state
     */
    getValidationState(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return null;

        if (input.classList.contains('valid')) return 'valid';
        if (input.classList.contains('invalid')) return 'invalid';
        if (input.classList.contains('validating')) return 'validating';
        return null;
    }

    /**
     * Removes a validator
     * @param {string} inputId - Input element ID
     */
    removeValidator(inputId) {
        if (this.debounceTimeouts.has(inputId)) {
            clearTimeout(this.debounceTimeouts.get(inputId));
            this.debounceTimeouts.delete(inputId);
        }

        this.clearValidation(inputId);
        this.validators.delete(inputId);
    }
}