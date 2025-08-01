/**
 * NotificationManager - Handles toast notifications and user feedback
 * Replaces basic alert() calls with modern, styled notifications
 */
class NotificationManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    this.toasts = new Map(); // Track active toasts
    this.toastCounter = 0;

    // Loading overlay elements
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.loadingTitle = document.getElementById('loading-title');
    this.loadingMessage = document.getElementById('loading-message');
    this.loadingProgress = document.getElementById('loading-progress');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');

    this.isLoadingVisible = false;
    this.currentProgress = 0;
  }

  /**
   * Shows a toast notification
   * @param {string} message - The message to display
   * @param {string} type - Type of notification (error, success, warning, info)
   * @param {number} duration - Duration in milliseconds (0 = no auto-close)
   * @param {Object} options - Additional options
   */
  showToast(message, type = 'info', duration = 5000, options = {}) {
    const toastId = `toast-${++this.toastCounter}`;
    const toast = this.createToastElement(toastId, message, type, options);

    this.container.appendChild(toast);
    this.toasts.set(toastId, { element: toast, type });

    // Trigger show animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-close after duration (if specified)
    if (duration > 0) {
      setTimeout(() => {
        this.closeToast(toastId);
      }, duration);
    }

    return toastId;
  }

  /**
   * Shows an error notification
   * @param {string} message - Error message
   * @param {number} duration - Duration in milliseconds
   */
  showError(message, duration = 7000) {
    return this.showToast(message, 'error', duration, {
      title: 'Error',
    });
  }

  /**
   * Shows a success notification
   * @param {string} message - Success message
   * @param {number} duration - Duration in milliseconds
   */
  showSuccess(message, duration = 4000) {
    return this.showToast(message, 'success', duration, {
      title: 'Success',
    });
  }

  /**
   * Shows a warning notification
   * @param {string} message - Warning message
   * @param {number} duration - Duration in milliseconds
   */
  showWarning(message, duration = 6000) {
    return this.showToast(message, 'warning', duration, {
      title: 'Warning',
    });
  }

  /**
   * Shows an info notification
   * @param {string} message - Info message
   * @param {number} duration - Duration in milliseconds
   */
  showInfo(message, duration = 5000) {
    return this.showToast(message, 'info', duration, {
      title: 'Info',
    });
  }

  /**
   * Shows a loading notification (persistent until manually closed)
   * @param {string} message - Loading message
   */
  showLoading(message) {
    return this.showToast(message, 'info', 0, {
      title: 'Loading...',
      showCloseButton: false,
    });
  }

  /**
   * Creates a toast DOM element
   * @param {string} toastId - Unique toast ID
   * @param {string} message - Message to display
   * @param {string} type - Toast type
   * @param {Object} options - Additional options
   * @returns {HTMLElement} - Toast element
   */
  createToastElement(toastId, message, type, options = {}) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;

    const title = options.title || this.getDefaultTitle(type);
    const showCloseButton = options.showCloseButton !== false;
    const actions = options.actions || [];

    let actionsHtml = '';
    if (actions.length > 0) {
      actionsHtml = `
                <div class="toast-actions">
                    ${actions
                      .map(
                        action =>
                          `<button class="toast-action-btn ${action.style || 'primary'}" onclick="${action.onclick}">${action.text}</button>`
                      )
                      .join('')}
                </div>
            `;
    }

    toast.innerHTML = `
            <div class="toast-header">
                <div class="toast-title">${title}</div>
                ${showCloseButton ? `<button class="toast-close" onclick="notificationManager.closeToast('${toastId}')">&times;</button>` : ''}
            </div>
            <div class="toast-message">${message}</div>
            ${actionsHtml}
        `;

    return toast;
  }

  /**
   * Gets default title for toast type
   * @param {string} type - Toast type
   * @returns {string} - Default title
   */
  getDefaultTitle(type) {
    const titles = {
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
    };
    return titles[type] || 'Notification';
  }

  /**
   * Closes a specific toast
   * @param {string} toastId - Toast ID to close
   */
  closeToast(toastId) {
    const toastData = this.toasts.get(toastId);
    if (!toastData) {
      return;
    }

    const toast = toastData.element;
    toast.classList.add('closing');

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(toastId);
    }, 300);
  }

  /**
   * Closes all toasts
   */
  closeAllToasts() {
    this.toasts.forEach((toastData, toastId) => {
      this.closeToast(toastId);
    });
  }

  /**
   * Closes all toasts of a specific type
   * @param {string} type - Toast type to close
   */
  closeToastsByType(type) {
    this.toasts.forEach((toastData, toastId) => {
      if (toastData.type === type) {
        this.closeToast(toastId);
      }
    });
  }

  /**
   * Updates an existing toast message
   * @param {string} toastId - Toast ID to update
   * @param {string} newMessage - New message
   */
  updateToast(toastId, newMessage) {
    const toastData = this.toasts.get(toastId);
    if (!toastData) {
      return;
    }

    const messageElement = toastData.element.querySelector('.toast-message');
    if (messageElement) {
      messageElement.textContent = newMessage;
    }
  }

  /**
   * Shows the loading overlay with progress
   * @param {string} title - Loading title
   * @param {string} message - Loading message
   * @param {boolean} showProgress - Whether to show progress bar
   */
  showLoadingOverlay(
    title = 'Loading...',
    message = 'Please wait',
    showProgress = false
  ) {
    if (!this.loadingOverlay) {
      return;
    }

    this.loadingTitle.textContent = title;
    this.loadingMessage.textContent = message;

    if (showProgress) {
      this.loadingProgress.style.display = 'block';
      this.setProgress(0);
    } else {
      this.loadingProgress.style.display = 'none';
    }

    // Show the overlay with proper animation
    this.loadingOverlay.style.display = 'flex';
    // Force reflow before adding show class for smooth animation
    this.loadingOverlay.offsetHeight;
    this.loadingOverlay.classList.add('show');
    this.isLoadingVisible = true;
  }

  /**
   * Hides the loading overlay
   */
  hideLoadingOverlay() {
    if (!this.loadingOverlay) {
      return;
    }

    this.loadingOverlay.classList.remove('show');

    // Hide the overlay after animation completes
    setTimeout(() => {
      if (!this.isLoadingVisible) {
        this.loadingOverlay.style.display = 'none';
      }
    }, 300);

    this.isLoadingVisible = false;
    this.currentProgress = 0;
  }

  /**
   * Updates the loading overlay message
   * @param {string} title - New title
   * @param {string} message - New message
   */
  updateLoadingOverlay(title, message) {
    if (!this.isLoadingVisible) {
      return;
    }

    if (title) {
      this.loadingTitle.textContent = title;
    }
    if (message) {
      this.loadingMessage.textContent = message;
    }
  }

  /**
   * Sets the progress percentage
   * @param {number} percent - Progress percentage (0-100)
   */
  setProgress(percent) {
    if (!this.progressFill || !this.progressText) {
      return;
    }

    this.currentProgress = Math.max(0, Math.min(100, percent));
    this.progressFill.style.width = `${this.currentProgress}%`;
    this.progressText.textContent = `${Math.round(this.currentProgress)}%`;
  }

  /**
   * Increments progress by a certain amount
   * @param {number} increment - Amount to increment (0-100)
   */
  incrementProgress(increment) {
    this.setProgress(this.currentProgress + increment);
  }

  /**
   * Creates a simulated progress animation
   * @param {number} duration - Duration in milliseconds
   * @param {Function} onComplete - Callback when complete
   */
  simulateProgress(duration = 3000, onComplete = null) {
    if (!this.isLoadingVisible) {
      return;
    }

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      this.setProgress(progress);

      if (progress < 100) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };

    animate();
  }

  /**
   * Shows loading with automatic progress simulation
   * @param {string} title - Loading title
   * @param {string} message - Loading message
   * @param {number} estimatedDuration - Estimated duration in milliseconds
   */
  showLoadingWithProgress(title, message, estimatedDuration = 3000) {
    this.showLoadingOverlay(title, message, true);
    this.simulateProgress(estimatedDuration);
  }
}
