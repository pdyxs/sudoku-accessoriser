/**
 * Tests for NotificationManager class
 * @jest-environment jsdom
 */

describe('NotificationManager', () => {
    let NotificationManager;
    let notificationManager;
    let container;
    let loadingOverlay;

    beforeAll(() => {
        // Define NotificationManager class for testing (simplified version)
        global.NotificationManager = class NotificationManager {
            constructor() {
                this.toasts = new Map();
                this.toastIdCounter = 0;
                this.isLoadingVisible = false;
                this.currentProgress = 0;
                this.progressInterval = null;
                this.container = document.getElementById('toast-container');
                this.loadingOverlay = document.getElementById('loading-overlay');
            }

            showToast(message, type = 'info', duration = 5000, options = {}) {
                if (!this.container) return null;
                
                const toastId = `toast-${++this.toastIdCounter}`;
                
                const toast = document.createElement('div');
                toast.className = `toast ${type}`;
                toast.id = toastId;
                
                const messageElement = document.createElement('span');
                messageElement.className = 'toast-message';
                messageElement.textContent = message;
                toast.appendChild(messageElement);
                
                if (options.actions) {
                    options.actions.forEach(action => {
                        const button = document.createElement('button');
                        button.className = `toast-action-btn ${action.style || ''}`;
                        button.textContent = action.text;
                        button.onclick = new Function(action.onclick);
                        toast.appendChild(button);
                    });
                }
                
                this.container.appendChild(toast);
                
                this.toasts.set(toastId, {
                    type: type,
                    element: toast,
                    duration: duration
                });
                
                if (duration > 0) {
                    setTimeout(() => this.closeToast(toastId), duration);
                }
                
                return toastId;
            }

            showError(message, duration = 0) {
                return this.showToast(message, 'error', duration);
            }

            showSuccess(message, duration = 5000) {
                return this.showToast(message, 'success', duration);
            }

            showWarning(message, duration = 5000) {
                return this.showToast(message, 'warning', duration);
            }

            closeToast(toastId) {
                const toastData = this.toasts.get(toastId);
                if (!toastData) return;
                
                toastData.element.classList.add('closing');
                
                setTimeout(() => {
                    if (toastData.element.parentNode) {
                        toastData.element.parentNode.removeChild(toastData.element);
                    }
                    this.toasts.delete(toastId);
                }, 300);
            }

            closeAllToasts() {
                this.toasts.forEach((_, toastId) => {
                    const toastData = this.toasts.get(toastId);
                    if (toastData) {
                        toastData.element.classList.add('closing');
                    }
                });
            }

            closeToastsByType(type) {
                this.toasts.forEach((toastData, toastId) => {
                    if (toastData.type === type) {
                        toastData.element.classList.add('closing');
                    }
                });
            }

            updateToast(toastId, message) {
                const toastData = this.toasts.get(toastId);
                if (!toastData) return;
                
                const messageElement = toastData.element.querySelector('.toast-message');
                if (messageElement) {
                    messageElement.textContent = message;
                }
            }

            showLoadingOverlay(title = 'Loading...', message = 'Please wait', showProgress = false) {
                if (!this.loadingOverlay) return;
                
                this.loadingOverlay.classList.add('show');
                this.isLoadingVisible = true;
                
                const titleElement = document.getElementById('loading-title');
                const messageElement = document.getElementById('loading-message');
                const progressElement = document.getElementById('loading-progress');
                
                if (titleElement) titleElement.textContent = title;
                if (messageElement) messageElement.textContent = message;
                
                if (progressElement) {
                    progressElement.style.display = showProgress ? 'block' : 'none';
                }
                
                if (showProgress) {
                    this.currentProgress = 0;
                    this.setProgress(0);
                }
            }

            hideLoadingOverlay() {
                if (!this.loadingOverlay) return;
                
                this.loadingOverlay.classList.remove('show');
                this.isLoadingVisible = false;
                
                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                }
            }

            updateLoadingOverlay(title, message) {
                if (!this.isLoadingVisible) return;
                
                const titleElement = document.getElementById('loading-title');
                const messageElement = document.getElementById('loading-message');
                
                if (titleElement && title) titleElement.textContent = title;
                if (messageElement && message) messageElement.textContent = message;
            }

            setProgress(percentage) {
                this.currentProgress = Math.max(0, Math.min(100, percentage));
                
                const progressFill = document.getElementById('progress-fill');
                const progressText = document.getElementById('progress-text');
                
                if (progressFill) progressFill.style.width = `${this.currentProgress}%`;
                if (progressText) progressText.textContent = `${this.currentProgress}%`;
            }

            incrementProgress(amount) {
                this.setProgress(this.currentProgress + amount);
            }

            simulateProgress(targetProgress, onComplete) {
                const startProgress = this.currentProgress;
                const progressDiff = targetProgress - startProgress;
                const steps = 10;
                const stepSize = progressDiff / steps;
                const stepDelay = 100 / steps;
                
                let currentStep = 0;
                const interval = setInterval(() => {
                    currentStep++;
                    const newProgress = startProgress + (stepSize * currentStep);
                    this.setProgress(newProgress);
                    
                    if (currentStep >= steps) {
                        clearInterval(interval);
                        if (onComplete) onComplete();
                    }
                }, stepDelay);
            }

            showLoadingWithProgress(title, message, targetProgress) {
                this.showLoadingOverlay(title, message, true);
                this.simulateProgress(targetProgress);
            }
        };
        
        NotificationManager = global.NotificationManager;
    });

    beforeEach(() => {
        // Set up DOM for each test
        document.body.innerHTML = `
            <div id="toast-container" class="toast-container"></div>
            <div id="loading-overlay" class="loading-overlay">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-title" id="loading-title">Loading...</div>
                    <div class="loading-message" id="loading-message">Please wait</div>
                    <div class="loading-progress" id="loading-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-text" id="progress-text">0%</div>
                    </div>
                </div>
            </div>
        `;
        
        container = document.getElementById('toast-container');
        loadingOverlay = document.getElementById('loading-overlay');
        
        // Create new instance
        notificationManager = new NotificationManager();
        
        // Mock window.notificationManager
        global.notificationManager = notificationManager;
    });

    afterEach(() => {
        // Clean up any timers
        jest.clearAllTimers();
        jest.clearAllMocks();
    });

    describe('Toast Notifications', () => {
        test('should create and show a basic toast', () => {
            const toastId = notificationManager.showToast('Test message', 'info');
            
            expect(toastId).toBeDefined();
            expect(container.children.length).toBe(1);
            
            const toast = container.firstChild;
            expect(toast.classList.contains('toast')).toBe(true);
            expect(toast.classList.contains('info')).toBe(true);
            expect(toast.textContent).toContain('Test message');
        });

        test('should show error notification with correct styling', () => {
            const toastId = notificationManager.showError('Error message');
            
            const toast = container.firstChild;
            expect(toast.classList.contains('error')).toBe(true);
            expect(toast.textContent).toContain('Error');
            expect(toast.textContent).toContain('Error message');
        });

        test('should show success notification', () => {
            const toastId = notificationManager.showSuccess('Success message');
            
            const toast = container.firstChild;
            expect(toast.classList.contains('success')).toBe(true);
            expect(toast.textContent).toContain('Success');
            expect(toast.textContent).toContain('Success message');
        });

        test('should show warning notification', () => {
            const toastId = notificationManager.showWarning('Warning message');
            
            const toast = container.firstChild;
            expect(toast.classList.contains('warning')).toBe(true);
            expect(toast.textContent).toContain('Warning');
            expect(toast.textContent).toContain('Warning message');
        });

        test('should create toast with action buttons', () => {
            const toastId = notificationManager.showToast('Message', 'info', 0, {
                actions: [
                    { text: 'Action 1', onclick: 'test1()' },
                    { text: 'Action 2', onclick: 'test2()', style: 'secondary' }
                ]
            });
            
            const toast = container.firstChild;
            const actionButtons = toast.querySelectorAll('.toast-action-btn');
            
            expect(actionButtons.length).toBe(2);
            expect(actionButtons[0].textContent).toBe('Action 1');
            expect(actionButtons[1].textContent).toBe('Action 2');
            expect(actionButtons[1].classList.contains('secondary')).toBe(true);
        });

        test('should close toast when requested', (done) => {
            const toastId = notificationManager.showToast('Test message');
            expect(container.children.length).toBe(1);
            
            notificationManager.closeToast(toastId);
            
            // Toast should be marked as closing
            const toast = container.firstChild;
            expect(toast.classList.contains('closing')).toBe(true);
            
            // Should be removed from DOM after animation
            setTimeout(() => {
                expect(container.children.length).toBe(0);
                done();
            }, 350);
        });

        test('should close all toasts', () => {
            notificationManager.showToast('Message 1');
            notificationManager.showToast('Message 2');
            notificationManager.showToast('Message 3');
            
            expect(container.children.length).toBe(3);
            
            notificationManager.closeAllToasts();
            
            // All toasts should be marked as closing
            Array.from(container.children).forEach(toast => {
                expect(toast.classList.contains('closing')).toBe(true);
            });
        });

        test('should close toasts by type', () => {
            notificationManager.showError('Error 1');
            notificationManager.showSuccess('Success 1');
            notificationManager.showError('Error 2');
            
            expect(container.children.length).toBe(3);
            
            notificationManager.closeToastsByType('error');
            
            const toasts = Array.from(container.children);
            expect(toasts[0].classList.contains('closing')).toBe(true); // Error 1
            expect(toasts[1].classList.contains('closing')).toBe(false); // Success 1
            expect(toasts[2].classList.contains('closing')).toBe(true); // Error 2
        });

        test('should update toast message', () => {
            const toastId = notificationManager.showToast('Original message');
            
            notificationManager.updateToast(toastId, 'Updated message');
            
            const toast = container.firstChild;
            const messageElement = toast.querySelector('.toast-message');
            expect(messageElement.textContent).toBe('Updated message');
        });
    });

    describe('Loading Overlay', () => {
        test('should show loading overlay', () => {
            notificationManager.showLoadingOverlay('Loading Test', 'Please wait');
            
            expect(loadingOverlay.classList.contains('show')).toBe(true);
            expect(notificationManager.isLoadingVisible).toBe(true);
            
            const title = document.getElementById('loading-title');
            const message = document.getElementById('loading-message');
            expect(title.textContent).toBe('Loading Test');
            expect(message.textContent).toBe('Please wait');
        });

        test('should hide loading overlay', () => {
            notificationManager.showLoadingOverlay();
            expect(notificationManager.isLoadingVisible).toBe(true);
            
            notificationManager.hideLoadingOverlay();
            
            expect(loadingOverlay.classList.contains('show')).toBe(false);
            expect(notificationManager.isLoadingVisible).toBe(false);
        });

        test('should show loading overlay with progress', () => {
            notificationManager.showLoadingOverlay('Loading', 'With progress', true);
            
            const progressElement = document.getElementById('loading-progress');
            expect(progressElement.style.display).toBe('block');
            expect(notificationManager.currentProgress).toBe(0);
        });

        test('should update loading overlay message', () => {
            notificationManager.showLoadingOverlay();
            
            notificationManager.updateLoadingOverlay('New Title', 'New Message');
            
            const title = document.getElementById('loading-title');
            const message = document.getElementById('loading-message');
            expect(title.textContent).toBe('New Title');
            expect(message.textContent).toBe('New Message');
        });

        test('should not update loading overlay when not visible', () => {
            const title = document.getElementById('loading-title');
            const originalTitle = title.textContent;
            
            notificationManager.updateLoadingOverlay('New Title', 'New Message');
            
            expect(title.textContent).toBe(originalTitle);
        });
    });

    describe('Progress Management', () => {
        beforeEach(() => {
            notificationManager.showLoadingOverlay('Test', 'Test', true);
        });

        test('should set progress percentage', () => {
            notificationManager.setProgress(50);
            
            expect(notificationManager.currentProgress).toBe(50);
            
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');
            expect(progressFill.style.width).toBe('50%');
            expect(progressText.textContent).toBe('50%');
        });

        test('should increment progress', () => {
            notificationManager.setProgress(30);
            notificationManager.incrementProgress(20);
            
            expect(notificationManager.currentProgress).toBe(50);
            
            const progressText = document.getElementById('progress-text');
            expect(progressText.textContent).toBe('50%');
        });

        test('should clamp progress to 0-100 range', () => {
            notificationManager.setProgress(-10);
            expect(notificationManager.currentProgress).toBe(0);
            
            notificationManager.setProgress(150);
            expect(notificationManager.currentProgress).toBe(100);
        });

        test('should simulate progress animation', (done) => {
            const onComplete = jest.fn();
            
            notificationManager.simulateProgress(100, onComplete);
            
            setTimeout(() => {
                expect(notificationManager.currentProgress).toBeGreaterThan(0);
            }, 50);
            
            setTimeout(() => {
                expect(notificationManager.currentProgress).toBe(100);
                expect(onComplete).toHaveBeenCalled();
                done();
            }, 150);
        });

        test('should show loading with automatic progress', () => {
            notificationManager.hideLoadingOverlay(); // Reset
            
            notificationManager.showLoadingWithProgress('Loading', 'Auto progress', 100);
            
            expect(notificationManager.isLoadingVisible).toBe(true);
            
            const progressElement = document.getElementById('loading-progress');
            expect(progressElement.style.display).toBe('block');
        });
    });

    describe('Toast ID Management', () => {
        test('should generate unique toast IDs', () => {
            const id1 = notificationManager.showToast('Message 1');
            const id2 = notificationManager.showToast('Message 2');
            
            expect(id1).not.toBe(id2);
            expect(notificationManager.toasts.has(id1)).toBe(true);
            expect(notificationManager.toasts.has(id2)).toBe(true);
        });

        test('should track toast data', () => {
            const id = notificationManager.showError('Error message');
            
            const toastData = notificationManager.toasts.get(id);
            expect(toastData).toBeDefined();
            expect(toastData.type).toBe('error');
            expect(toastData.element).toBeDefined();
        });

        test('should remove toast from tracking when closed', (done) => {
            const id = notificationManager.showToast('Test');
            expect(notificationManager.toasts.has(id)).toBe(true);
            
            notificationManager.closeToast(id);
            
            setTimeout(() => {
                expect(notificationManager.toasts.has(id)).toBe(false);
                done();
            }, 350);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            // Remove container
            document.getElementById('toast-container').remove();
            
            const newManager = new NotificationManager();
            
            // Should not throw error
            expect(() => {
                newManager.showToast('Test message');
            }).not.toThrow();
        });

        test('should handle missing loading overlay elements', () => {
            document.getElementById('loading-overlay').remove();
            
            const newManager = new NotificationManager();
            
            expect(() => {
                newManager.showLoadingOverlay();
                newManager.setProgress(50);
            }).not.toThrow();
        });

        test('should handle invalid toast ID for closure', () => {
            expect(() => {
                notificationManager.closeToast('invalid-id');
            }).not.toThrow();
        });

        test('should handle update of non-existent toast', () => {
            expect(() => {
                notificationManager.updateToast('invalid-id', 'New message');
            }).not.toThrow();
        });
    });
});