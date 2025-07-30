# Testing Utilities Documentation

**Status**: Completed  
**Date**: 2025-07-30

## Overview

This document outlines the testing utilities and patterns established during the Jest migration project. These tools and patterns should be used for future testing work in the project.

## ModuleLoader Utility

### Location
`tests/helpers/module-loader.js`

### Purpose
Custom utility for loading vanilla JavaScript files in Jest environment using Node's vm module to simulate browser script loading.

### Usage
```javascript
const ModuleLoader = require('../helpers/module-loader');

describe('Example Test', () => {
    beforeEach(() => {
        // Load required modules
        ModuleLoader.loadScript('src/utilities.js');
        ModuleLoader.loadScript('src/puzzle-converter.js');
    });
    
    afterEach(() => {
        ModuleLoader.cleanup();
    });
});
```

### Key Features
- Simulates browser global scope
- Handles module dependencies
- Provides cleanup between tests
- Works with vanilla JS classes and functions

## API Mocking System

### Location
`tests/__mocks__/sudokupad-api.js`

### Purpose
Mock SudokuPad API responses for testing puzzle conversion without external dependencies.

### Usage
```javascript
// Automatically mocked when using fetch in tests
// Returns sample puzzle data based on puzzle ID
```

### Features
- Handles multiple puzzle formats
- Returns realistic puzzle data
- Supports error simulation

## Test Structure Patterns

### File Organization
- Unit tests: `tests/unit/[module-name].test.js`
- Helpers: `tests/helpers/`
- Mocks: `tests/__mocks__/`

### Test Categories Established
1. **puzzle-converter.test.js** - URL validation, ID extraction, puzzle conversion
2. **utilities.test.js** - Utility functions and helper methods
3. **url-patterns.test.js** - URL pattern matching and validation
4. **line-features.test.js** - Line feature extraction and processing
5. **curved-lines.test.js** - SVG curved line support

### Common Test Pattern
```javascript
const ModuleLoader = require('../helpers/module-loader');

describe('Module Tests', () => {
    beforeEach(() => {
        ModuleLoader.loadScript('src/required-file.js');
    });
    
    afterEach(() => {
        ModuleLoader.cleanup();
    });
    
    test('should test specific functionality', () => {
        // Test implementation
    });
});
```

## Configuration

### Jest Setup
- Environment: jsdom
- Test match: `tests/**/*.test.js`
- Setup files: None required (ModuleLoader handles script loading)

### Package.json Scripts
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode

## Migration Results

- **Total tests migrated**: 82 tests
- **Test files created**: 5 unit test files
- **HTML test files removed**: 5 legacy files
- **Test success rate**: 100%

## Future Testing Guidelines

1. Use ModuleLoader for all vanilla JS testing
2. Mock external APIs using the established pattern
3. Follow the file organization structure
4. Clean up properly between tests
5. Group related tests logically within describe blocks