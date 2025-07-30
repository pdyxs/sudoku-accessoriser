/**
 * ThemeManager - Handles theme switching and persistence
 * Extracted from SudokuAccessoriser for better separation of concerns
 */
class ThemeManager {
    constructor() {
        this.initializeTheme();
    }

    /**
     * Initializes the theme system and applies saved theme
     */
    initializeTheme() {
        // Check for saved theme preference or default to 'auto'
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // Default to auto theme
            if (!localStorage.getItem('theme')) {
                localStorage.setItem('theme', 'auto');
            }
            this.setTheme('auto');
        }
    }

    /**
     * Toggles between light, dark, and auto themes
     */
    toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'auto';
        const themes = ['auto', 'light', 'dark'];
        const currentIndex = themes.indexOf(currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        
        this.setTheme(nextTheme);
    }

    /**
     * Sets the theme and updates UI
     * @param {string} theme - Theme name ('auto', 'light', or 'dark')
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icon
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            const icons = {
                'auto': '🌓',
                'light': '☀️',
                'dark': '🌙'
            };
            themeIcon.textContent = icons[theme] || '🌓';
        }
    }

    /**
     * Gets the current theme
     * @returns {string} - Current theme name
     */
    getCurrentTheme() {
        return localStorage.getItem('theme') || 'auto';
    }

    /**
     * Checks if the current theme is dark mode (including auto-dark)
     * @returns {boolean} - True if dark mode is active
     */
    isDarkMode() {
        const theme = this.getCurrentTheme();
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        
        // For auto theme, check system preference
        if (theme === 'auto') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        return false;
    }

    /**
     * Adds a listener for system theme changes (for auto mode)
     * @param {Function} callback - Callback function to call on theme change
     */
    addSystemThemeListener(callback) {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener(callback);
        }
    }

    /**
     * Gets available theme options
     * @returns {Array} - Array of theme objects with name and display values
     */
    getAvailableThemes() {
        return [
            { name: 'auto', display: 'Auto', icon: '🌓' },
            { name: 'light', display: 'Light', icon: '☀️' },
            { name: 'dark', display: 'Dark', icon: '🌙' }
        ];
    }
}