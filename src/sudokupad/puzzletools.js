// Adapted from https://github.com/marktekfan/sudokupad-penpa-import/blob/main/src/sudokupad/puzzletools.js
// Converted from ES6 modules to work with vanilla JS/Parcel
// Simplified version for basic functionality

const PuzzleTools = (() => {
	
	// Basic utility functions for puzzle processing
	const getCellIndex = (row, col, size = 9) => row * size + col;
	const getCellPosition = (index, size = 9) => [Math.floor(index / size), index % size];
	
	const isValidCell = (row, col, size = 9) => row >= 0 && row < size && col >= 0 && col < size;
	
	const getRegionIndex = (row, col, regionSize = 3) => {
		const regionRow = Math.floor(row / regionSize);
		const regionCol = Math.floor(col / regionSize);
		return regionRow * regionSize + regionCol;
	};

	const getCellsInRegion = (regionIndex, regionSize = 3, gridSize = 9) => {
		const cells = [];
		const startRow = Math.floor(regionIndex / regionSize) * regionSize;
		const startCol = (regionIndex % regionSize) * regionSize;
		
		for (let r = startRow; r < startRow + regionSize; r++) {
			for (let c = startCol; c < startCol + regionSize; c++) {
				if (isValidCell(r, c, gridSize)) {
					cells.push(getCellIndex(r, c, gridSize));
				}
			}
		}
		return cells;
	};

	// Basic puzzle format detection
	const detectPuzzleFormat = (data) => {
		if (typeof data !== 'string') return 'unknown';
		
		// Check for common puzzle formats
		if (data.includes('sudokupad.app')) return 'sudokupad-url';
		if (data.startsWith('scl')) return 'scl';
		if (data.startsWith('fpuz')) return 'fpuz';
		if (data.startsWith('scf')) return 'scf';
		if (data.startsWith('{') && data.includes('"grid"')) return 'json';
		
		return 'unknown';
	};

	// Basic SCF decoding (simplified)
	const decodeSCF = (data) => {
		try {
			// This is a placeholder for SCF decoding
			// The full implementation would be quite complex
			console.warn('SCF decoding not fully implemented yet');
			return JSON.parse(data);
		} catch (e) {
			console.error('SCF decode error:', e);
			return null;
		}
	};

	// Basic classic sudoku encoding/decoding
	const encodeClassicSudoku = (grid) => {
		if (!Array.isArray(grid) || grid.length !== 81) {
			throw new Error('Invalid grid format for classic sudoku');
		}
		
		// Simple encoding - just join the values
		return grid.map(cell => cell || '0').join('');
	};

	const decodeClassicSudoku = (encoded) => {
		if (typeof encoded !== 'string' || encoded.length !== 81) {
			throw new Error('Invalid encoded classic sudoku format');
		}
		
		return encoded.split('').map(char => {
			const num = parseInt(char);
			return (num >= 1 && num <= 9) ? num : null;
		});
	};

	// Thumbnail generation placeholder
	const generateThumbnail = async (puzzleData, options = {}) => {
		console.warn('Thumbnail generation not implemented in simplified version');
		return null;
	};

	// SVG utilities (simplified)
	const createBasicSVG = (width = 450, height = 450) => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('width', width);
		svg.setAttribute('height', height);
		svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
		return svg;
	};

	const addGridLines = (svg, size = 9, cellSize = 50) => {
		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		g.setAttribute('class', 'grid-lines');
		
		// Add horizontal and vertical lines
		for (let i = 0; i <= size; i++) {
			// Vertical lines
			const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			vLine.setAttribute('x1', i * cellSize);
			vLine.setAttribute('y1', 0);
			vLine.setAttribute('x2', i * cellSize);
			vLine.setAttribute('y2', size * cellSize);
			vLine.setAttribute('stroke', i % 3 === 0 ? '#000' : '#ccc');
			vLine.setAttribute('stroke-width', i % 3 === 0 ? '2' : '1');
			g.appendChild(vLine);
			
			// Horizontal lines
			const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			hLine.setAttribute('x1', 0);
			hLine.setAttribute('y1', i * cellSize);
			hLine.setAttribute('x2', size * cellSize);
			hLine.setAttribute('y2', i * cellSize);
			hLine.setAttribute('stroke', i % 3 === 0 ? '#000' : '#ccc');
			hLine.setAttribute('stroke-width', i % 3 === 0 ? '2' : '1');
			g.appendChild(hLine);
		}
		
		svg.appendChild(g);
		return svg;
	};

	// Color utilities
	const hexToRgb = (hex) => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	};

	const rgbToHex = (r, g, b) => {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	};

	return {
		getCellIndex,
		getCellPosition,
		isValidCell,
		getRegionIndex,
		getCellsInRegion,
		detectPuzzleFormat,
		decodeSCF,
		encodeClassicSudoku,
		decodeClassicSudoku,
		generateThumbnail,
		createBasicSVG,
		addGridLines,
		hexToRgb,
		rgbToHex
	};
})();

// Export for vanilla JS/Parcel
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { PuzzleTools };
} else if (typeof window !== 'undefined') {
	window.PuzzleTools = PuzzleTools;
}