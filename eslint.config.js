import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        localStorage: 'readonly',
        
        // Node.js globals for tests
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        fail: 'readonly',
        
        // Project-specific globals (defined in files, not global scope)
        PuzzleLoader: 'readonly',
        loadFPuzzle: 'readonly',
        PuzzleZipper: 'readonly',
        Event: 'readonly',
        
        // CommonJS/Node.js globals for test and config files
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly'
      }
    },
    plugins: {
      prettier
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',
      
      // Code quality rules
      'no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_|^[A-Z][a-zA-Z]*$', // Allow unused class names
        'ignoreRestSiblings': true
      }],
      'no-console': 'off', // Allow console for debugging
      'no-debugger': 'error',
      'no-alert': 'warn',
      
      // Best practices
      'eqeqeq': 'error',
      'curly': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-proto': 'error',
      'no-iterator': 'error',
      
      // Variable declarations
      'no-undef': 'error',
      'no-undefined': 'off',
      'no-use-before-define': ['error', { 'functions': false }],
      'no-redeclare': 'off', // Allow redeclaring classes in different scopes
      
      // Style (handled mostly by Prettier)
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      
      // Modern JS practices
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      
      // Async/await
      'no-async-promise-executor': 'error',
      'require-await': 'warn'
    }
  },
  {
    // Special rules for test files
    files: ['tests/**/*.js'],
    rules: {
      'no-unused-expressions': 'off' // Jest matchers look like unused expressions
    }
  },
  {
    // Ignore certain files
    ignores: [
      'dist/**',
      '.parcel-cache/**',
      'node_modules/**',
      'coverage/**',
      'src/sudokupad/**' // Third-party sudokupad utilities
    ]
  }
];