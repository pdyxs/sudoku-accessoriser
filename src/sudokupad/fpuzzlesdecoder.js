// Adapted from https://github.com/marktekfan/sudokupad-penpa-import/blob/main/src/sudokupad/fpuzzlesdecoder.js
// Converted from ES6 modules to work with vanilla JS/Parcel

const loadFPuzzle = (() => {
	
	const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	const b64tab = (() => {
		let tab = {}
		for (let i = 0; i < 64; i++) {
			tab[b64chars.charAt(i)] = i
		}
		return tab;
	})();

	const b64decode = (s) => {
		let pads = 0, i, b10;
		const imax = s.length
		if (s.charAt(imax - 1) == '=') {
			pads = 1;
			if (s.charAt(imax - 2) == '=') {
				pads = 2;
			}
		}
		const imax2 = imax - pads;
		let x = [];
		for (i = 0; i < imax2; i += 4) {
			b10 = (b64tab[s.charAt(i)] << 18) | (b64tab[s.charAt(i + 1)] << 12) | (b64tab[s.charAt(i + 2)] << 6) | b64tab[s.charAt(i + 3)];
			x.push(String.fromCharCode((b10 >> 16) & 255));
			x.push(String.fromCharCode((b10 >> 8) & 255));
			x.push(String.fromCharCode(b10 & 255));
		}
		switch (pads) {
			case 1:
				b10 = (b64tab[s.charAt(i)] << 18) | (b64tab[s.charAt(i + 1)] << 12) | (b64tab[s.charAt(i + 2)] << 6);
				x.push(String.fromCharCode((b10 >> 16) & 255));
				x.push(String.fromCharCode((b10 >> 8) & 255));
				break;
			case 2:
				b10 = (b64tab[s.charAt(i)] << 18) | (b64tab[s.charAt(i + 1)] << 12);
				x.push(String.fromCharCode((b10 >> 16) & 255));
				break;
		}
		return x.join('');
	}

	const b64encode = (s) => {
		let i, b10;
		const x = [];
		const imax = s.length - s.length % 3;
		if (s.length == 0) {
			return s;
		}
		for (i = 0; i < imax; i += 3) {
			b10 = (s.charCodeAt(i) << 16) | (s.charCodeAt(i + 1) << 8) | s.charCodeAt(i + 2);
			x.push(b64chars.charAt((b10 >> 18) & 63));
			x.push(b64chars.charAt((b10 >> 12) & 63));
			x.push(b64chars.charAt((b10 >> 6) & 63));
			x.push(b64chars.charAt(b10 & 63));
		}
		switch (s.length - imax) {
			case 1:
				b10 = s.charCodeAt(i) << 16;
				x.push(b64chars.charAt((b10 >> 18) & 63));
				x.push(b64chars.charAt((b10 >> 12) & 63));
				x.push('==');
				break;
			case 2:
				b10 = (s.charCodeAt(i) << 16) | (s.charCodeAt(i + 1) << 8);
				x.push(b64chars.charAt((b10 >> 18) & 63));
				x.push(b64chars.charAt((b10 >> 12) & 63));
				x.push(b64chars.charAt((b10 >> 6) & 63));
				x.push('=');
				break;
		}
		return x.join('');
	}

	// Simple decompression for now - may need to add proper LZ-string or similar
	const decompressPuzzle = (s) => {
		try {
			// Try PuzzleZipper unzip if available
			if (typeof PuzzleZipper !== 'undefined') {
				return PuzzleZipper.unzip(b64decode(s));
			}
			// Fallback to direct b64 decode
			return b64decode(s);
		} catch (e) {
			// If decompression fails, return as-is (might already be decompressed)
			return s;
		}
	}

	const compressPuzzle = (s) => {
		try {
			// Try PuzzleZipper zip if available
			if (typeof PuzzleZipper !== 'undefined') {
				return b64encode(PuzzleZipper.zip(s));
			}
			// Fallback to direct b64 encode
			return b64encode(s);
		} catch (e) {
			return b64encode(s);
		}
	}

	const stringifyBoard = (board) => {
		return Array.isArray(board) ? board.join(",") : board;
	}

	const parseBoard = (board) => {
		if (Array.isArray(board)) return board;
		if (typeof board === "string") {
			return board === "" ? [] : board.split(",");
		}
		return [];
	}

	const parseLine = (line) => {
		if (Array.isArray(line)) return line;
		if (typeof line === "string") {
			return line === "" ? [] : line.split(",").map(s => parseInt(s));
		}
		return [];
	}

	const stringifyLine = (line) => {
		return Array.isArray(line) ? line.join(",") : line;
	}

	const parseCages = (cages) => {
		if (Array.isArray(cages)) return cages;
		if (typeof cages === "string") {
			return cages === "" ? [] : cages.split(",").map(s => {
				const parts = s.split(":");
				if (parts.length >= 2) {
					return { value: parts[0], cells: parts[1].split("+") };
				}
				return { value: "", cells: [] };
			});
		}
		return [];
	}

	const loadFPuzzleFromData = (input) => {
		try {
			// Try to decompress and parse
			const decompressed = decompressPuzzle(input);
			const puzzle = JSON.parse(decompressed);
			
			// Parse all fields that need special handling
			if (puzzle.board) puzzle.board = parseBoard(puzzle.board);
			if (puzzle.cages) puzzle.cages = parseCages(puzzle.cages);
			// Add more parsing as needed...
			
			return puzzle;
		} catch (e) {
			console.error('Failed to load F-Puzzle data:', e);
			throw new Error('Invalid F-Puzzle format');
		}
	}

	const createMd5Hash = async (data) => {
		// Simple MD5 implementation for creating puzzle hashes
		if (typeof window !== 'undefined' && window.SudokuPadUtilities && window.SudokuPadUtilities.md5Digest) {
			return await window.SudokuPadUtilities.md5Digest(data);
		}
		// Fallback - just return a simple hash
		let hash = 0;
		for (let i = 0; i < data.length; i++) {
			const char = data.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(16);
	}

	return {
		loadFPuzzle: loadFPuzzleFromData,
		decompressPuzzle,
		compressPuzzle,
		createMd5Hash
	};

})();

// Export for vanilla JS/Parcel
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { loadFPuzzle };
} else if (typeof window !== 'undefined') {
	window.loadFPuzzle = loadFPuzzle;
}