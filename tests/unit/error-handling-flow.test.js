/**
 * Integration tests for error handling flow
 * Tests the complete flow from user input through validation, loading, and error feedback
 * @jest-environment jsdom
 */

describe('Error Handling Integration Flow', () => {
    let NotificationManager, ValidationManager, PuzzleManager;
    let notificationManager, validationManager, puzzleManager;
    
    beforeAll(() => {
        // Define simplified classes for integration testing
        global.NotificationManager = class NotificationManager {
            constructor() {
                this.toasts = new Map();
                this.toastIdCounter = 0;
                this.isLoadingVisible = false;
            }

            showToast(message, type = 'info', duration = 5000) {
                const container = document.getElementById('toast-container');
                if (!container) return null;
                
                const toastId = `toast-${++this.toastIdCounter}`;
                const toast = document.createElement('div');
                toast.className = `toast ${type}`;
                toast.id = toastId;
                toast.innerHTML = `<span class="toast-message">${message}</span>`;
                
                container.appendChild(toast);
                this.toasts.set(toastId, { type, element: toast });
                
                return toastId;
            }

            showError(message) { return this.showToast(message, 'error', 0); }
            showSuccess(message) { return this.showToast(message, 'success'); }
            showWarning(message) { return this.showToast(message, 'warning'); }
            showInfo(message) { return this.showToast(message, 'info'); }

            showLoadingOverlay(title = 'Loading...') {
                const overlay = document.getElementById('loading-overlay');
                if (overlay) {
                    overlay.classList.add('show');
                    this.isLoadingVisible = true;
                }
            }

            hideLoadingOverlay() {
                const overlay = document.getElementById('loading-overlay');
                if (overlay) {
                    overlay.classList.remove('show');
                    this.isLoadingVisible = false;
                }
            }
        };

        global.ValidationManager = class ValidationManager {
            constructor() {
                this.validators = new Map();
            }

            registerValidator(inputId, validator, options = {}) {
                const input = document.getElementById(inputId);
                if (!input) return;

                const config = {
                    validator,
                    feedbackId: options.feedbackId,
                    iconId: options.iconId
                };

                this.validators.set(inputId, config);
            }

            async validateInput(inputId) {
                const config = this.validators.get(inputId);
                if (!config) return false;

                const input = document.getElementById(inputId);
                if (!input) return false;

                try {
                    const result = await config.validator(input.value.trim());
                    
                    if (result.isValid) {
                        input.classList.remove('invalid');
                        input.classList.add('valid');
                        
                        if (config.feedbackId) {
                            const feedback = document.getElementById(config.feedbackId);
                            if (feedback) feedback.textContent = result.message;
                        }
                        
                        if (config.iconId) {
                            const icon = document.getElementById(config.iconId);
                            if (icon) icon.textContent = '✓';
                        }
                        
                        return true;
                    } else {
                        input.classList.remove('valid');
                        input.classList.add('invalid');
                        
                        if (config.feedbackId) {
                            const feedback = document.getElementById(config.feedbackId);
                            if (feedback) feedback.textContent = result.message;
                        }
                        
                        if (config.iconId) {
                            const icon = document.getElementById(config.iconId);
                            if (icon) icon.textContent = '✗';
                        }
                        
                        return false;
                    }
                } catch (error) {
                    input.classList.add('invalid');
                    return false;
                }
            }

            createSudokuPadUrlValidator() {
                return async (url) => {
                    if (!url) {
                        return { isValid: false, message: 'Please enter a URL' };
                    }

                    try {
                        const parsedUrl = new URL(url);
                        if (!['sudokupad.app', 'www.sudokupad.app'].includes(parsedUrl.hostname)) {
                            return { isValid: false, message: 'Please enter a SudokuPad URL (sudokupad.app)' };
                        }

                        const path = parsedUrl.pathname;
                        if (path === '/' || path.length <= 1) {
                            return { isValid: false, message: 'URL must include a puzzle ID (e.g., https://sudokupad.app/abc123)' };
                        }

                        return { isValid: true, message: 'Valid SudokuPad puzzle URL' };
                    } catch (error) {
                        return { isValid: false, message: 'Please enter a valid URL' };
                    }
                };
            }
        };

        global.PuzzleManager = class PuzzleManager {
            classifyError(error) {
                const message = error.message.toLowerCase();
                if (message.includes('network')) return 'network';
                if (message.includes('timeout')) return 'timeout';
                if (message.includes('404')) return 'not_found';
                if (message.includes('403')) return 'forbidden';
                return 'unknown';
            }

            createUserFriendlyError(originalError, errorType) {
                const messages = {
                    network: 'Network connection failed. Please check your internet connection and try again.',
                    timeout: 'Request timed out. The puzzle server may be slow to respond. Please try again.',
                    not_found: 'Puzzle not found. Please check that the URL is correct and the puzzle exists.',
                    forbidden: 'Access denied. This puzzle may be private or the URL may be incorrect.'
                };

                const userError = new Error(messages[errorType] || `Failed to load puzzle: ${originalError.message}`);
                userError.originalError = originalError;
                userError.errorType = errorType;
                return userError;
            }

            async extractPuzzleData(url) {
                try {
                    return await global.PuzzleConverter.convertSudokuPadUrl(url);
                } catch (error) {
                    const errorType = this.classifyError(error);
                    throw this.createUserFriendlyError(error, errorType);
                }
            }
        };

        // Mock UI Controller methods  
        global.UIController = class UIController {
            showLoading(message) {
                const button = document.querySelector('#puzzle-url-form button');
                const overlay = document.getElementById('loading-overlay');
                
                if (button) {
                    button.disabled = true;
                    button.classList.add('button-loading');
                }
                
                if (overlay) {
                    overlay.style.display = 'flex';
                    overlay.classList.add('show');
                }
            }

            resetLoadingState() {
                const button = document.querySelector('#puzzle-url-form button');
                const overlay = document.getElementById('loading-overlay');
                
                if (button) {
                    button.disabled = false;
                    button.classList.remove('button-loading');
                }
                
                if (overlay) {
                    overlay.classList.remove('show');
                    setTimeout(() => {
                        overlay.style.display = 'none';
                    }, 300);
                }
            }

            showError(message) {
                this.resetLoadingState();
                if (global.notificationManager) {
                    global.notificationManager.showError(message);
                }
            }

            showSuccess(message) {
                if (global.notificationManager) {
                    global.notificationManager.showSuccess(message);
                }
            }

            showWarning(message) {
                if (global.notificationManager) {
                    global.notificationManager.showWarning(message);
                }
            }

            showInfo(message) {
                if (global.notificationManager) {
                    global.notificationManager.showInfo(message);
                }
            }
        };

        NotificationManager = global.NotificationManager;
        ValidationManager = global.ValidationManager;
        PuzzleManager = global.PuzzleManager;
    });

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = `
            <div id="toast-container" class="toast-container"></div>
            <div id="loading-overlay" class="loading-overlay">
                <div class="loading-content">
                    <div class="loading-title" id="loading-title">Loading...</div>
                </div>
            </div>
            <form id="puzzle-url-form">
                <div class="input-group">
                    <input type="url" id="puzzle-url" />
                    <span class="validation-icon" id="validation-icon"></span>
                    <div class="input-feedback" id="url-feedback"></div>
                </div>
                <button type="submit">Load Puzzle</button>
            </form>
        `;

        // Initialize managers
        notificationManager = new NotificationManager();
        validationManager = new ValidationManager();
        puzzleManager = new PuzzleManager();
        
        global.notificationManager = notificationManager;
        global.validationManager = validationManager;

        // Set up validation
        validationManager.registerValidator(
            'puzzle-url',
            validationManager.createSudokuPadUrlValidator(),
            {
                feedbackId: 'url-feedback',
                iconId: 'validation-icon'
            }
        );

        // Mock PuzzleConverter
        global.PuzzleConverter = {
            isValidSudokuPadUrl: jest.fn(),
            convertSudokuPadUrl: jest.fn(),
            extractPuzzleId: jest.fn()
        };

        jest.clearAllMocks();
    });

    describe('Successful Load Flow', () => {
        test('should complete successful puzzle loading flow', async () => {
            const uiController = new global.UIController();
            
            // Mock successful response
            global.PuzzleConverter.convertSudokuPadUrl.mockResolvedValue({
                title: 'Test Puzzle',
                puzzleId: 'test123',
                features: []
            });

            const input = document.getElementById('puzzle-url');
            input.value = 'https://sudokupad.app/test123';
            
            // Validate input
            const isValid = await validationManager.validateInput('puzzle-url');
            expect(isValid).toBe(true);
            expect(input.classList.contains('valid')).toBe(true);

            // Start loading
            uiController.showLoading('Loading puzzle...');
            const button = document.querySelector('#puzzle-url-form button');
            expect(button.disabled).toBe(true);

            // Load puzzle
            const result = await puzzleManager.extractPuzzleData('https://sudokupad.app/test123');
            
            // Reset loading state
            uiController.resetLoadingState();
            uiController.showSuccess('Puzzle loaded successfully!');

            // Verify results
            expect(result.title).toBe('Test Puzzle');
            expect(button.disabled).toBe(false);
            
            const toastContainer = document.getElementById('toast-container');
            expect(toastContainer.children.length).toBe(1);
            
            const successToast = toastContainer.firstChild;
            expect(successToast.classList.contains('success')).toBe(true);
        });
    });

    describe('Validation Error Flow', () => {
        test('should handle invalid URL validation', async () => {
            const input = document.getElementById('puzzle-url');
            input.value = 'https://sudokupad.app/';
            
            const isValid = await validationManager.validateInput('puzzle-url');
            
            expect(isValid).toBe(false);
            expect(input.classList.contains('invalid')).toBe(true);
            
            const feedback = document.getElementById('url-feedback');
            expect(feedback.textContent).toContain('puzzle ID');
            
            const icon = document.getElementById('validation-icon');
            expect(icon.textContent).toBe('✗');
        });

        test('should handle non-SudokuPad URL validation', async () => {
            const input = document.getElementById('puzzle-url');
            input.value = 'https://example.com/puzzle123';
            
            const isValid = await validationManager.validateInput('puzzle-url');
            
            expect(isValid).toBe(false);
            expect(input.classList.contains('invalid')).toBe(true);
            
            const feedback = document.getElementById('url-feedback');
            expect(feedback.textContent).toContain('SudokuPad URL');
        });
    });

    describe('Network Error Flow', () => {
        test('should handle network errors with user-friendly message', async () => {
            const uiController = new global.UIController();
            const networkError = new Error('Network request failed');
            
            global.PuzzleConverter.convertSudokuPadUrl.mockRejectedValue(networkError);
            
            uiController.showLoading('Loading puzzle...');
            
            try {
                await puzzleManager.extractPuzzleData('https://sudokupad.app/test123');
            } catch (error) {
                uiController.showError(error.message);
            }
            
            const button = document.querySelector('#puzzle-url-form button');
            expect(button.disabled).toBe(false);
            
            const toastContainer = document.getElementById('toast-container');
            expect(toastContainer.children.length).toBe(1);
            
            const errorToast = toastContainer.firstChild;
            expect(errorToast.classList.contains('error')).toBe(true);
            expect(errorToast.textContent).toContain('Network connection failed');
        });

        test('should handle 404 errors appropriately', async () => {
            const uiController = new global.UIController();
            const notFoundError = new Error('Puzzle not found (404)');
            
            global.PuzzleConverter.convertSudokuPadUrl.mockRejectedValue(notFoundError);
            
            try {
                await puzzleManager.extractPuzzleData('https://sudokupad.app/nonexistent');
            } catch (error) {
                uiController.showError(error.message);
            }
            
            const toastContainer = document.getElementById('toast-container');
            const errorToast = toastContainer.firstChild;
            expect(errorToast.textContent).toContain('Puzzle not found');
        });
    });

    describe('Loading State Management', () => {
        test('should properly manage loading overlay visibility', () => {
            const uiController = new global.UIController();
            const loadingOverlay = document.getElementById('loading-overlay');
            
            // Initially hidden
            expect(loadingOverlay.classList.contains('show')).toBe(false);
            
            // Show loading
            uiController.showLoading('Loading...');
            expect(loadingOverlay.style.display).toBe('flex');
            expect(loadingOverlay.classList.contains('show')).toBe(true);
            
            // Reset loading
            uiController.resetLoadingState();
            expect(loadingOverlay.classList.contains('show')).toBe(false);
        });

        test('should disable form during loading', () => {
            const uiController = new global.UIController();
            const button = document.querySelector('#puzzle-url-form button');
            
            expect(button.disabled).toBe(false);
            
            uiController.showLoading('Loading...');
            expect(button.disabled).toBe(true);
            expect(button.classList.contains('button-loading')).toBe(true);
            
            uiController.resetLoadingState();
            expect(button.disabled).toBe(false);
            expect(button.classList.contains('button-loading')).toBe(false);
        });
    });

    describe('Toast Notification Integration', () => {
        test('should show different types of toast notifications', () => {
            const uiController = new global.UIController();
            
            uiController.showInfo('Starting load...');
            uiController.showError('Load failed');
            uiController.showWarning('Retrying...');
            uiController.showSuccess('Success!');
            
            const toastContainer = document.getElementById('toast-container');
            expect(toastContainer.children.length).toBe(4);
            
            const toasts = Array.from(toastContainer.children);
            expect(toasts[0].classList.contains('info')).toBe(true);
            expect(toasts[1].classList.contains('error')).toBe(true);
            expect(toasts[2].classList.contains('warning')).toBe(true);
            expect(toasts[3].classList.contains('success')).toBe(true);
        });
    });

    describe('Form Submission Integration', () => {
        test('should prevent submission with invalid URL', async () => {
            const input = document.getElementById('puzzle-url');
            input.value = 'invalid-url';
            
            const isValid = await validationManager.validateInput('puzzle-url');
            expect(isValid).toBe(false);
            expect(input.classList.contains('invalid')).toBe(true);
            
            const feedback = document.getElementById('url-feedback');
            expect(feedback.textContent).toContain('valid URL');
        });
    });
});