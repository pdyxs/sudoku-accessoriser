# Overview

This is a project to create a website that allows users to enter the url of a sudoku puzzle, choose adjustments and customisations of that puzzle to suite their accessibility needs, and then return a new puzzle.

The website should be built using vanilla js and css (without any frameworks), and should be deployed using github pages. It is built and deployed using parcel.

## Puzzle data

To achieve this, the website will have to retrieve the json data from a sudokupad puzzle, in scl format. Before implementing a solution, it is VITAL that you make a plan for exactly how to do this and save that to a markdown file, based on the example implementation at https://github.com/marktekfan/sudokupad-penpa-import. This is a vue website. The flow we're interested in is:
* A user enters a sudokupad url in the textbox labelled "Penpa+, f-puzzles, SudokuPad or tinyurl.com URL or JSON" (e.g. https://sudokupad.app/psxczr0jpr)
* A user selects "Convert to JSON" in the "Action" dropdown
* A user clicks "Convert Puzzle"
* The url that the user entered is replaced by the JSON for the puzzle (the sample above should return the json in 'sample-sudokupad.json' in this directory).

In coming up with a plan, it's important to trace the path that this code takes to understand exactly how the url is transformed into JSON.

Within the https://github.com/marktekfan/sudokupad-penpa-import respository, the scripts within the src/sudokupad folder are general utilities. If they're needed, they should be copied across with minimal changes (e.g. altering the import method to better suit this project).

## Overall flow

The flow of the website is as follows:
1. The user enters the url of a puzzle
2. The user is shown a list of different features in the puzzles (e.g. lines of different colours)
3. The user is able to customise how each of those features is displayed (e.g. change the colours, make a line hollow, add a text annotation)
4. The user is able to open the altered puzzle in a new tab.

## Version Management

The application displays a version number in the header to help track deployments. When making significant changes or deploying updates:

1. **Update the version number** in `index.html` (line ~16):
   ```html
   <span class="version">v1.0.0</span>
   ```

2. **Version numbering scheme**:
   - **Major version** (v2.0.0): Breaking changes or major new features
   - **Minor version** (v1.1.0): New features, significant improvements
   - **Patch version** (v1.0.1): Bug fixes, small improvements

3. **When to update**:
   - Before deploying to GitHub Pages
   - After completing major features or bug fixes
   - When making changes that users should be aware of

This helps verify that deployments have succeeded and provides users with a reference for the current version.