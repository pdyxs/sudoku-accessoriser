// Helper to load vanilla JS modules in Jest environment
// This simulates how the browser loads script tags sequentially

const fs = require('fs');
const path = require('path');
const vm = require('vm');

class ModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.globals = {
      // Provide browser-like globals that the modules expect
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Promise,
      fetch: global.fetch || jest.fn(), // Use mocked fetch
      document: global.document,
      window: global.window,
      // Add other globals as needed
    };
  }

  /**
   * Load a vanilla JS file into the test environment
   * @param {string} relativePath - Path relative to project root
   */
  loadModule(relativePath) {
    const fullPath = path.resolve(process.cwd(), relativePath);

    if (this.loadedModules.has(fullPath)) {
      return; // Already loaded
    }

    try {
      const code = fs.readFileSync(fullPath, 'utf8');

      // Create a context that includes our globals and existing global state
      const context = vm.createContext({
        ...this.globals,
        ...global, // Include existing global state from previous modules
      });

      // Execute the module code in the context
      vm.runInContext(code, context);

      // Copy new globals back to our global scope
      Object.keys(context).forEach(key => {
        if (
          !this.globals.hasOwnProperty(key) &&
          typeof context[key] !== 'undefined'
        ) {
          global[key] = context[key];
        }
      });

      this.loadedModules.add(fullPath);
      console.log(`✓ Loaded module: ${relativePath}`);
    } catch (error) {
      console.error(`✗ Failed to load module ${relativePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Load multiple modules in sequence (like script tags in HTML)
   * @param {string[]} paths - Array of paths to load in order
   */
  loadModules(paths) {
    paths.forEach(path => this.loadModule(path));
  }

  /**
   * Reset loaded modules (useful for test isolation)
   */
  reset() {
    this.loadedModules.clear();
    // Clear globals that were added by modules
    // (Be careful not to clear Jest's globals)
  }
}

module.exports = ModuleLoader;
