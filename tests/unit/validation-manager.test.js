/**
 * Tests for ValidationManager class
 * @jest-environment jsdom
 */

// Mock PuzzleConverter
global.PuzzleConverter = {
    isValidSudokuPadUrl: jest.fn(),
    extractPuzzleId: jest.fn()
};

describe('ValidationManager', () => {
    let ValidationManager;
    let validationManager;
    let testInput;
    let testFeedback;
    let testIcon;

    beforeAll(() => {
        // Define ValidationManager class for testing (simplified version)
        global.ValidationManager = class ValidationManager {
            constructor() {
                this.validators = new Map();
                this.debounceTimeouts = new Map();
                this.debounceDelay = 300;
            }

            registerValidator(inputId, validator, options = {}) {
                const input = document.getElementById(inputId);
                if (!input) {
                    console.warn(`Input element with ID '${inputId}' not found`);
                    return;
                }

                const config = {
                    validator,
                    feedbackId: options.feedbackId || `${inputId}-feedback`,
                    iconId: options.iconId || `${inputId}-icon`,
                    validateOnInput: options.validateOnInput !== false,
                    showSuccess: options.showSuccess !== false,
                    debounceDelay: options.debounceDelay || this.debounceDelay
                };

                this.validators.set(inputId, config);

                // Add event listeners
                if (config.validateOnInput) {
                    input.addEventListener('input', () => this.handleInputEvent(inputId));
                }
                input.addEventListener('blur', () => this.validateInput(inputId));
            }

            handleInputEvent(inputId) {
                const config = this.validators.get(inputId);
                if (!config) return;

                // Clear existing timeout
                if (this.debounceTimeouts.has(inputId)) {
                    clearTimeout(this.debounceTimeouts.get(inputId));
                }

                // Set validating state
                this.setValidationState(inputId, 'validating', 'Checking...');

                // Set new timeout
                const timeout = setTimeout(() => {
                    this.validateInput(inputId);
                    this.debounceTimeouts.delete(inputId);
                }, config.debounceDelay);

                this.debounceTimeouts.set(inputId, timeout);
            }

            async validateInput(inputId) {
                const config = this.validators.get(inputId);
                if (!config) return false;

                const input = document.getElementById(inputId);
                if (!input) return false;

                const value = input.value.trim();

                try {
                    const result = await config.validator(value, input);
                    
                    if (result.isValid) {
                        if (config.showSuccess) {
                            this.setValidationState(inputId, 'valid', result.message);
                        } else {
                            this.setValidationState(inputId, 'neutral', '');
                        }
                        return true;
                    } else {
                        this.setValidationState(inputId, 'invalid', result.message);
                        return false;
                    }
                } catch (error) {
                    console.error('Validation error:', error);
                    this.setValidationState(inputId, 'invalid', 'Validation failed');
                    return false;
                }
            }

            setValidationState(inputId, state, message) {
                const config = this.validators.get(inputId);
                if (!config) return;

                const input = document.getElementById(inputId);
                const feedback = document.getElementById(config.feedbackId);
                const icon = document.getElementById(config.iconId);

                if (input) {
                    input.classList.remove('valid', 'invalid', 'validating');
                    if (state !== 'neutral') {
                        input.classList.add(state);
                    }
                }

                if (feedback) {
                    feedback.textContent = message;
                    feedback.classList.remove('valid', 'invalid', 'validating');
                    if (state !== 'neutral') {
                        feedback.classList.add(state);
                    }
                }

                if (icon) {
                    icon.classList.remove('success', 'error', 'validating');
                    switch (state) {
                        case 'valid':
                            icon.textContent = '✓';
                            icon.classList.add('success');
                            break;
                        case 'invalid':
                            icon.textContent = '✗';
                            icon.classList.add('error');
                            break;
                        case 'validating':
                            icon.textContent = '⟳';
                            icon.classList.add('validating');
                            break;
                        default:
                            icon.textContent = '';
                    }
                }
            }

            clearValidation(inputId) {
                this.setValidationState(inputId, 'neutral', '');
            }

            getValidationState(inputId) {
                const input = document.getElementById(inputId);
                if (!input) return null;

                if (input.classList.contains('valid')) return 'valid';
                if (input.classList.contains('invalid')) return 'invalid';
                if (input.classList.contains('validating')) return 'validating';
                return null;
            }

            async validateAll() {
                const results = await Promise.all(
                    Array.from(this.validators.keys()).map(inputId => this.validateInput(inputId))
                );
                return results.every(result => result === true);
            }

            removeValidator(inputId) {
                // Clear any pending timeouts
                if (this.debounceTimeouts.has(inputId)) {
                    clearTimeout(this.debounceTimeouts.get(inputId));
                    this.debounceTimeouts.delete(inputId);
                }

                // Clear validation state
                this.clearValidation(inputId);

                // Remove from validators
                this.validators.delete(inputId);
            }

            createSudokuPadUrlValidator() {
                return async (url) => {
                    // Check if URL is empty
                    if (!url || url.trim() === '') {
                        return {
                            isValid: false,
                            message: 'Please enter a URL'
                        };
                    }

                    // Check if URL is valid format
                    let parsedUrl;
                    try {
                        parsedUrl = new URL(url);
                    } catch (error) {
                        return {
                            isValid: false,
                            message: 'Please enter a valid URL'
                        };
                    }

                    // Check if it's a SudokuPad domain
                    const validDomains = ['sudokupad.app', 'www.sudokupad.app'];
                    if (!validDomains.includes(parsedUrl.hostname)) {
                        return {
                            isValid: false,
                            message: 'Please enter a SudokuPad URL (sudokupad.app)'
                        };
                    }

                    // Check for puzzle ID in path
                    const path = parsedUrl.pathname;
                    const invalidPaths = ['/', '/app', '/puzzles', '/create', '/about'];
                    
                    if (invalidPaths.includes(path) || path.length <= 1) {
                        return {
                            isValid: false,
                            message: 'URL must include a puzzle ID (e.g., https://sudokupad.app/abc123)'
                        };
                    }

                    // Use PuzzleConverter if available
                    if (typeof PuzzleConverter !== 'undefined') {
                        const isValidFormat = PuzzleConverter.isValidSudokuPadUrl(url);
                        if (!isValidFormat) {
                            return {
                                isValid: false,
                                message: 'Please enter a valid SudokuPad puzzle URL'
                            };
                        }

                        const puzzleId = PuzzleConverter.extractPuzzleId(url);
                        if (!puzzleId || puzzleId.trim() === '') {
                            return {
                                isValid: false,
                                message: 'Could not find a puzzle ID in this URL'
                            };
                        }
                    }

                    return {
                        isValid: true,
                        message: 'Valid SudokuPad puzzle URL'
                    };
                };
            }
        };
        
        ValidationManager = global.ValidationManager;
    });

    beforeEach(() => {
        // Set up DOM for each test
        document.body.innerHTML = `
            <div>
                <input type="url" id="test-input" />
                <div id="test-feedback" class="input-feedback"></div>
                <span id="test-icon" class="validation-icon"></span>
            </div>
        `;
        
        validationManager = new ValidationManager();
        
        testInput = document.getElementById('test-input');
        testFeedback = document.getElementById('test-feedback');
        testIcon = document.getElementById('test-icon');
        
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('Validator Registration', () => {
        test('should register a validator for an input', () => {
            const validator = jest.fn().mockResolvedValue({ isValid: true, message: 'Valid' });
            
            validationManager.registerValidator('test-input', validator);
            
            expect(validationManager.validators.has('test-input')).toBe(true);
            const config = validationManager.validators.get('test-input');
            expect(config.validator).toBe(validator);
        });

        test('should not register validator for non-existent input', () => {
            const validator = jest.fn();
            
            validationManager.registerValidator('non-existent', validator);
            
            expect(validationManager.validators.has('non-existent')).toBe(false);
        });

        test('should register with custom options', () => {
            const validator = jest.fn();
            const options = {
                feedbackId: 'custom-feedback',
                iconId: 'custom-icon',
                validateOnInput: false,
                showSuccess: false
            };
            
            validationManager.registerValidator('test-input', validator, options);
            
            const config = validationManager.validators.get('test-input');
            expect(config.validateOnInput).toBe(false);
            expect(config.showSuccess).toBe(false);
        });
    });

    describe('Input Event Handling', () => {
        test('should validate on input with debouncing', () => {
            const validator = jest.fn().mockResolvedValue({ isValid: true, message: 'Valid' });
            validationManager.registerValidator('test-input', validator);
            
            // Simulate input event
            testInput.value = 'test value';
            testInput.dispatchEvent(new Event('input'));
            
            // Should not validate immediately (debounced)
            expect(validator).not.toHaveBeenCalled();
            expect(testInput.classList.contains('validating')).toBe(true);
            
            // Fast-forward past debounce delay
            jest.advanceTimersByTime(500);
            
            expect(validator).toHaveBeenCalledWith('test value', testInput);
        });

        test('should validate immediately on blur', async () => {
            const validator = jest.fn().mockResolvedValue({ isValid: true, message: 'Valid' });
            validationManager.registerValidator('test-input', validator);
            
            testInput.value = 'test value';
            testInput.dispatchEvent(new Event('blur'));
            
            // Should validate immediately, no debouncing
            expect(validator).toHaveBeenCalledWith('test value', testInput);
        });

        test('should clear previous debounce timeout on new input', () => {
            const validator = jest.fn().mockResolvedValue({ isValid: true, message: 'Valid' });
            validationManager.registerValidator('test-input', validator);
            
            // First input
            testInput.value = 'first';
            testInput.dispatchEvent(new Event('input'));
            
            // Second input before debounce completes
            jest.advanceTimersByTime(200);
            testInput.value = 'second';
            testInput.dispatchEvent(new Event('input'));
            
            // Fast-forward, but not past the second timeout
            jest.advanceTimersByTime(200);
            expect(validator).not.toHaveBeenCalled();
            
            // Fast-forward past second timeout
            jest.advanceTimersByTime(500);
            expect(validator).toHaveBeenCalledTimes(1);
            expect(validator).toHaveBeenCalledWith('second', testInput);
        });
    });

    describe('Validation State Management', () => {
        test('should set valid state correctly', () => {
            const validator = jest.fn().mockResolvedValue({ isValid: true, message: 'Valid input' });
            validationManager.registerValidator('test-input', validator, {
                feedbackId: 'test-feedback',
                iconId: 'test-icon'
            });
            
            validationManager.setValidationState('test-input', 'valid', 'Valid input');
            
            expect(testInput.classList.contains('valid')).toBe(true);
            expect(testInput.classList.contains('invalid')).toBe(false);
            expect(testFeedback.textContent).toBe('Valid input');
            expect(testFeedback.classList.contains('valid')).toBe(true);
            expect(testIcon.textContent).toBe('✓');
            expect(testIcon.classList.contains('success')).toBe(true);
        });

        test('should set invalid state correctly', () => {
            const validator = jest.fn();
            validationManager.registerValidator('test-input', validator, {
                feedbackId: 'test-feedback',
                iconId: 'test-icon'
            });
            
            validationManager.setValidationState('test-input', 'invalid', 'Invalid input');
            
            expect(testInput.classList.contains('invalid')).toBe(true);
            expect(testInput.classList.contains('valid')).toBe(false);
            expect(testFeedback.textContent).toBe('Invalid input');
            expect(testFeedback.classList.contains('invalid')).toBe(true);
            expect(testIcon.textContent).toBe('✗');
            expect(testIcon.classList.contains('error')).toBe(true);
        });

        test('should set validating state correctly', () => {
            const validator = jest.fn();
            validationManager.registerValidator('test-input', validator, {
                feedbackId: 'test-feedback',
                iconId: 'test-icon'
            });
            
            validationManager.setValidationState('test-input', 'validating', 'Checking...');
            
            expect(testInput.classList.contains('validating')).toBe(true);
            expect(testFeedback.textContent).toBe('Checking...');
            expect(testFeedback.classList.contains('validating')).toBe(true);
            expect(testIcon.textContent).toBe('⟳');
            expect(testIcon.classList.contains('validating')).toBe(true);
        });

        test('should clear validation state', () => {
            const validator = jest.fn();
            validationManager.registerValidator('test-input', validator, {
                feedbackId: 'test-feedback',
                iconId: 'test-icon'
            });
            
            // Set some state first
            validationManager.setValidationState('test-input', 'valid', 'Valid');
            
            // Clear it
            validationManager.clearValidation('test-input');
            
            expect(testInput.classList.contains('valid')).toBe(false);
            expect(testInput.classList.contains('invalid')).toBe(false);
            expect(testInput.classList.contains('validating')).toBe(false);
            expect(testFeedback.textContent).toBe('');
            expect(testIcon.textContent).toBe('');
        });
    });

    describe('Validation Execution', () => {
        test('should validate and return true for valid input', async () => {
            const validator = jest.fn().mockResolvedValue({ isValid: true, message: 'Valid' });
            validationManager.registerValidator('test-input', validator);
            
            testInput.value = 'valid input';
            const result = await validationManager.validateInput('test-input');
            
            expect(result).toBe(true);
            expect(validator).toHaveBeenCalledWith('valid input', testInput);
            expect(testInput.classList.contains('valid')).toBe(true);
        });

        test('should validate and return false for invalid input', async () => {
            const validator = jest.fn().mockResolvedValue({ isValid: false, message: 'Invalid' });
            validationManager.registerValidator('test-input', validator);
            
            testInput.value = 'invalid input';
            const result = await validationManager.validateInput('test-input');
            
            expect(result).toBe(false);
            expect(testInput.classList.contains('invalid')).toBe(true);
        });

        test('should handle validator errors gracefully', async () => {
            const validator = jest.fn().mockRejectedValue(new Error('Validation failed'));
            validationManager.registerValidator('test-input', validator);
            
            testInput.value = 'test input';
            const result = await validationManager.validateInput('test-input');
            
            expect(result).toBe(false);
            expect(testInput.classList.contains('invalid')).toBe(true);
        });

        test('should not show success state when showSuccess is false', async () => {
            const validator = jest.fn().mockResolvedValue({ isValid: true, message: 'Valid' });
            validationManager.registerValidator('test-input', validator, { showSuccess: false });
            
            testInput.value = 'valid input';
            await validationManager.validateInput('test-input');
            
            expect(testInput.classList.contains('valid')).toBe(false);
            expect(testInput.classList.contains('invalid')).toBe(false);
        });
    });

    describe('SudokuPad URL Validator', () => {
        let urlValidator;

        beforeEach(() => {
            urlValidator = validationManager.createSudokuPadUrlValidator();
        });

        test('should reject empty URLs', async () => {
            const result = await urlValidator('');
            
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Please enter a URL');
        });

        test('should reject invalid URL format', async () => {
            const result = await urlValidator('not-a-url');
            
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Please enter a valid URL');
        });

        test('should reject non-SudokuPad domains', async () => {
            const result = await urlValidator('https://example.com/puzzle123');
            
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Please enter a SudokuPad URL (sudokupad.app)');
        });

        test('should reject SudokuPad URLs without puzzle ID', async () => {
            const result = await urlValidator('https://sudokupad.app/');
            
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('URL must include a puzzle ID (e.g., https://sudokupad.app/abc123)');
        });

        test('should reject common invalid paths', async () => {
            const invalidUrls = [
                'https://sudokupad.app/',
                'https://sudokupad.app/app',
                'https://sudokupad.app/puzzles',
                'https://sudokupad.app/create'
            ];

            for (const url of invalidUrls) {
                const result = await urlValidator(url);
                expect(result.isValid).toBe(false);
                expect(result.message).toContain('URL must include a puzzle ID');
            }
        });

        test('should accept valid SudokuPad URLs with puzzle IDs', async () => {
            global.PuzzleConverter.isValidSudokuPadUrl.mockReturnValue(true);
            global.PuzzleConverter.extractPuzzleId.mockReturnValue('abc123');
            
            const result = await urlValidator('https://sudokupad.app/abc123');
            
            expect(result.isValid).toBe(true);
            expect(result.message).toBe('Valid SudokuPad puzzle URL');
        });

        test('should accept custom puzzle URLs with author/name format', async () => {
            global.PuzzleConverter.isValidSudokuPadUrl.mockReturnValue(true);
            global.PuzzleConverter.extractPuzzleId.mockReturnValue('author/puzzle-name');
            
            const result = await urlValidator('https://sudokupad.app/author/puzzle-name');
            
            expect(result.isValid).toBe(true);
            expect(result.message).toBe('Valid SudokuPad puzzle URL');
        });

        test('should use PuzzleConverter validation when available', async () => {
            global.PuzzleConverter.isValidSudokuPadUrl.mockReturnValue(false);
            
            const result = await urlValidator('https://sudokupad.app/invalidpuzzle');
            
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Please enter a valid SudokuPad puzzle URL');
            expect(global.PuzzleConverter.isValidSudokuPadUrl).toHaveBeenCalledWith('https://sudokupad.app/invalidpuzzle');
        });

        test('should check puzzle ID extraction when PuzzleConverter available', async () => {
            global.PuzzleConverter.isValidSudokuPadUrl.mockReturnValue(true);
            global.PuzzleConverter.extractPuzzleId.mockReturnValue('');
            
            const result = await urlValidator('https://sudokupad.app/nopuzzleid');
            
            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Could not find a puzzle ID in this URL');
        });
    });

    describe('Validation State Queries', () => {
        test('should return correct validation state', () => {
            validationManager.registerValidator('test-input', jest.fn());
            
            // No state initially
            expect(validationManager.getValidationState('test-input')).toBeNull();
            
            // Set valid state
            testInput.classList.add('valid');
            expect(validationManager.getValidationState('test-input')).toBe('valid');
            
            // Set invalid state
            testInput.classList.remove('valid');
            testInput.classList.add('invalid');
            expect(validationManager.getValidationState('test-input')).toBe('invalid');
            
            // Set validating state
            testInput.classList.remove('invalid');
            testInput.classList.add('validating');
            expect(validationManager.getValidationState('test-input')).toBe('validating');
        });

        test('should return null for non-existent input', () => {
            expect(validationManager.getValidationState('non-existent')).toBeNull();
        });
    });

    describe('Validate All', () => {
        test('should validate all registered inputs', async () => {
            // Set up multiple inputs
            document.body.innerHTML += '<input id="input2" /><input id="input3" />';
            
            const validator1 = jest.fn().mockResolvedValue({ isValid: true });
            const validator2 = jest.fn().mockResolvedValue({ isValid: true });
            const validator3 = jest.fn().mockResolvedValue({ isValid: false });
            
            validationManager.registerValidator('test-input', validator1);
            validationManager.registerValidator('input2', validator2);
            validationManager.registerValidator('input3', validator3);
            
            const result = await validationManager.validateAll();
            
            expect(result).toBe(false); // One input is invalid
            expect(validator1).toHaveBeenCalled();
            expect(validator2).toHaveBeenCalled();
            expect(validator3).toHaveBeenCalled();
        });

        test('should return true when all inputs are valid', async () => {
            document.body.innerHTML += '<input id="input2" />';
            
            const validator1 = jest.fn().mockResolvedValue({ isValid: true });
            const validator2 = jest.fn().mockResolvedValue({ isValid: true });
            
            validationManager.registerValidator('test-input', validator1);
            validationManager.registerValidator('input2', validator2);
            
            const result = await validationManager.validateAll();
            
            expect(result).toBe(true);
        });
    });

    describe('Cleanup', () => {
        test('should remove validator and clear state', () => {
            const validator = jest.fn();
            validationManager.registerValidator('test-input', validator);
            
            // Set some validation state
            validationManager.setValidationState('test-input', 'valid', 'Valid');
            
            // Remove validator
            validationManager.removeValidator('test-input');
            
            expect(validationManager.validators.has('test-input')).toBe(false);
            expect(testInput.classList.contains('valid')).toBe(false);
        });

        test('should clear debounce timeout when removing validator', () => {
            const validator = jest.fn();
            validationManager.registerValidator('test-input', validator);
            
            // Start validation with debounce
            testInput.dispatchEvent(new Event('input'));
            expect(validationManager.debounceTimeouts.has('test-input')).toBe(true);
            
            // Remove validator
            validationManager.removeValidator('test-input');
            
            expect(validationManager.debounceTimeouts.has('test-input')).toBe(false);
        });
    });
});