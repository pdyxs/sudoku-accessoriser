# Overview

This is a project to create a website that allows users to enter the url of a sudoku puzzle, choose adjustments and customisations of that puzzle to suite their accessibility needs, and then return a new puzzle.

The website should be built using vanilla js and css (without any frameworks), and should be deployed using github pages.

## Puzzle data

To achieve this, the website will have to retrieve the json data from a sudokupad puzzle, in scl format. We can find an example of a website that allows a user to extract json data from a sudokupad url here: https://github.com/marktekfan/sudokupad-penpa-import

Within that repository, the scripts within the src/sudokupad folder can (& should) be used verbatim.

## Overall flow

The flow of the website is as follows:
1. The user enters the url of a puzzle
2. The user is shown a list of different features in the puzzles (e.g. lines of different colours)
3. The user is able to customise how each of those features is displayed (e.g. change the colours, make a line hollow, add a text annotation)
4. The user is able to open the altered puzzle in a new tab.