# ModuleLoader Utility Reference

**Status**: Completed  
**Date**: 2025-07-30  
**Location**: `tests/helpers/module-loader.js`

## Purpose

The ModuleLoader utility solves the challenge of testing vanilla JavaScript files in a Jest environment. It uses Node's `vm` module to simulate browser script loading, allowing vanilla JS classes and functions to be tested without requiring module system modifications.

## Technical Implementation

### Core Mechanism
- Uses Node.js `vm.createContext()` to create an isolated execution environment
- Simulates browser globals (`window`, `document`, etc.)
- Loads scripts in dependency order
- Maintains global state between script loads within a test

### Key Methods

#### `loadScript(scriptPath)`
Loads and executes a JavaScript file in the simulated browser context.

```javascript
ModuleLoader.loadScript('src/utilities.js');
ModuleLoader.loadScript('src/puzzle-converter.js');
```

#### `cleanup()`
Clears the execution context between tests to prevent state leakage.

```javascript
afterEach(() => {
    ModuleLoader.cleanup();
});
```

#### `getGlobal(name)`
Retrieves a global variable from the execution context.

```javascript
const PuzzleConverter = ModuleLoader.getGlobal('PuzzleConverter');
```

## Usage Patterns

### Basic Test Setup
```javascript
const ModuleLoader = require('../helpers/module-loader');

describe('Component Tests', () => {
    beforeEach(() => {
        ModuleLoader.loadScript('src/utilities.js');
        ModuleLoader.loadScript('src/target-module.js');
    });
    
    afterEach(() => {
        ModuleLoader.cleanup();
    });
    
    test('should work with loaded modules', () => {
        const TargetClass = ModuleLoader.getGlobal('TargetClass');
        expect(TargetClass).toBeDefined();
    });
});
```

### Dependency Management
Load scripts in dependency order. If `puzzle-converter.js` depends on `utilities.js`, load utilities first:

```javascript
beforeEach(() => {
    ModuleLoader.loadScript('src/utilities.js');      // Dependencies first
    ModuleLoader.loadScript('src/puzzle-converter.js'); // Dependent modules after
});
```

## Browser Environment Simulation

The ModuleLoader creates these browser-like globals:
- `window` - Browser window object
- `document` - DOM document (jsdom-provided)
- `console` - Console for debugging
- `fetch` - HTTP client (jest-provided)

## Advantages

1. **No code modification required** - Test vanilla JS without changing source files
2. **Realistic environment** - Simulates actual browser script loading
3. **Isolated testing** - Each test gets clean state
4. **Dependency support** - Handle inter-script dependencies naturally

## Limitations

1. **Execution order matters** - Scripts must be loaded in dependency order
2. **Global scope only** - Only works with globally-defined classes/functions
3. **Jest-specific** - Designed for Jest testing environment

## Troubleshooting

### "Class is not defined" errors
Ensure dependencies are loaded in correct order:
```javascript
// Wrong order
ModuleLoader.loadScript('src/puzzle-converter.js'); // Uses utilities
ModuleLoader.loadScript('src/utilities.js');        // Loaded after

// Correct order
ModuleLoader.loadScript('src/utilities.js');        // Dependencies first
ModuleLoader.loadScript('src/puzzle-converter.js'); // Dependent after
```

### State leakage between tests
Always call cleanup in `afterEach`:
```javascript
afterEach(() => {
    ModuleLoader.cleanup(); // Essential for clean tests
});
```

## Alternative Solutions Considered

1. **Babel transformation** - Too complex for simple vanilla JS
2. **Manual module.exports** - Would require source code changes
3. **Dynamic imports** - Not supported in target vanilla JS environment
4. **Webpack test setup** - Overkill for simple testing needs

The ModuleLoader provides the optimal balance of simplicity and functionality for this project's testing needs.