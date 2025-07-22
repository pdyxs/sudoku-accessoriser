// Adapted from https://github.com/marktekfan/sudokupad-penpa-import/blob/main/src/sudokupad/puzzleloader.js
// Converted from ES6 modules to work with vanilla JS/Parcel

const PuzzleLoader = (() => {
	// Cache
		const cache = {};
		const updateCache = (puzzleId, data) => (cache[puzzleId] = data, data);
		const clearCache = puzzleId => puzzleId
			? delete cache[puzzleId]
			: Object.keys(cache).forEach(key => delete cache[key]);
		const cacheRaw = {};
		const updateCacheRaw = (puzzleId, data) => cacheRaw[puzzleId] = data;
		const clearCacheRaw = puzzleId => puzzleId
			? delete cacheRaw[puzzleId]
			: Object.keys(cacheRaw).forEach(key => delete cacheRaw[key]);
		const getPuzzleRaw = puzzleId => cacheRaw[puzzleId];
	
	// URLs
		const apiEncodePuzzleId = puzzleId => puzzleId.split('/').map(encodeURIComponent).join('/');
		const apiPuzzleUrlLocal = puzzleId => `https://sudokupad.app/api/puzzle/${apiEncodePuzzleId(puzzleId)}`;
		const apiPuzzleUrlLegacyProxy = puzzleId => `https://sudokupad.svencodes.com/ctclegacy/${encodeURIComponent(puzzleId)}`;
		const apiPuzzleUrlLegacy = puzzleId => `https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/${encodeURIComponent(puzzleId)}?alt=media`;
		const apiPuzzleUrls = puzzleId => [apiPuzzleUrlLocal(puzzleId), apiPuzzleUrlLegacyProxy(puzzleId), apiPuzzleUrlLegacy(puzzleId)];
	
	// Puzzle Format
		const saveDecompress = data => {
			let res;
			try {
				// Try loadFPuzzle decompression if available
				if (typeof loadFPuzzle !== 'undefined' && loadFPuzzle.decompressPuzzle) {
					res = loadFPuzzle.decompressPuzzle(data);
				} else {
					res = data; // Fallback to original data
				}
				if(res === null || res.length < 0.5 * data.length) res = data; // Not valid compressed data
			}
			catch (err) {
				console.warn('saveDecompress:', err);
				res = data;
			}
			return res;
		};

		const saveJsonUnzip = data => {
			if(typeof data === 'object') return data;
			try {
				return JSON.parse(data);
			}
			catch(err) {
				console.log('Direct JSON parse failed, trying decompression methods...');
				try {
					// If data starts with 'scl', strip the prefix and try decompression
					let processData = data;
					if (data.startsWith('scl')) {
						processData = data.substring(3); // Remove 'scl' prefix
						console.log('Stripped SCL prefix, remaining data length:', processData.length);
					}
					
					// Try loadFPuzzle decompression first (for base64 compressed data)
					if (typeof loadFPuzzle !== 'undefined' && loadFPuzzle.decompressPuzzle) {
						const decompressed = loadFPuzzle.decompressPuzzle(processData);
						console.log('F-Puzzle decompression successful, length:', decompressed.length);
						return JSON.parse(decompressed);
					}
				}
				catch(err2) {
					console.log('F-Puzzle decompression failed:', err2.message);
					try {
						// Try PuzzleZipper unzip if available
						if (typeof PuzzleZipper !== 'undefined') {
							const unzipped = PuzzleZipper.unzip(data);
							console.log('PuzzleZipper unzip successful');
							return JSON.parse(unzipped);
						}
					}
					catch(err3) {
						console.error('All decompression methods failed:', err3);
						return data;
					}
				}
			}
			return data;
		};

		const decompressPuzzleId = puzzleId => {
			let puzzle = puzzleId;
			try {
				puzzle = decodeURIComponent(puzzle);
			} catch(e) {
				// If decoding fails, use original
			}
			puzzle = saveDecompress(puzzle);
			return puzzle;
		};

		// Simple MD5 implementation for creating puzzle hashes
		const simpleMd5Hash = async (data) => {
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
		};

		const createPuzzleId = async (puzzleData, idPrefix) => {
			if(typeof puzzleData !== 'string') {
				puzzleData = JSON.stringify(puzzleData);
			}
			const hash = await simpleMd5Hash(puzzleData);
			return (idPrefix || 'scl') + hash;
		};

	// Fetch with timeout utility
		const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
			// Use the utility if available, otherwise create basic fetch with timeout
			if (typeof window !== 'undefined' && window.SudokuPadUtilities && window.SudokuPadUtilities.fetchWithTimeout) {
				return window.SudokuPadUtilities.fetchWithTimeout(url, options, timeout);
			}
			return Promise.race([
				fetch(url, options),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Request timeout')), timeout)
				)
			]);
		};

	// Fetch
		const fetchPuzzle = async (puzzleId, opts = {timeout: 10000}) => {
			// If it's not a remote puzzle ID, return as is
			if(puzzleId.includes('{') || puzzleId.includes('scl') || puzzleId.includes('fpuz')) {
				return puzzleId;
			}
			
			if(cache[puzzleId] !== undefined) return cache[puzzleId];
			
			let lastError;
			console.time('fetchPuzzle');
			let tryPuzzleUrls = apiPuzzleUrls(puzzleId);
			
			for(let i = 0; i < tryPuzzleUrls.length; i++) {
				let url = tryPuzzleUrls[i];
				try {
					console.log(`Trying to fetch puzzle from: ${url}`);
					let response = await fetchWithTimeout(url, opts, opts.timeout);
					let puzzle = await response.text();
					
					// Handle Firebase storage responses
					if(url.includes('firebasestorage')) {
						// Apply compression if PuzzleZipper is available
						if (typeof PuzzleZipper !== 'undefined') {
							puzzle = PuzzleZipper.zip(puzzle);
						}
					}
					
					// Cache and return
					puzzle = updateCache(puzzleId, puzzle);
					console.timeEnd('fetchPuzzle');
					return puzzle;
				}
				catch(err) {
					console.info('Partial error in fetchPuzzle:', err.message);
					lastError = err;
				}
			}
			console.timeEnd('fetchPuzzle');
			throw lastError || new Error('Failed to fetch puzzle from all sources');
		};

		const parsePuzzleData = async puzzleId => {
			try {
				// Simple parsing - try to decompress and parse JSON
				return saveJsonUnzip(decompressPuzzleId(puzzleId));
			}
			catch(err) {
				console.error('parsePuzzleData:', err);
				return puzzleId;
			}
		};

		const resolvePuzzleData = async puzzleId => {
			const fetchedPuzzle = await fetchPuzzle(puzzleId);
			return await parsePuzzleData(fetchedPuzzle);
		};

	return {
		apiEncodePuzzleId,
		apiPuzzleUrlLocal, 
		apiPuzzleUrlLegacyProxy, 
		apiPuzzleUrlLegacy,
		cache, 
		clearCache, 
		updateCache, 
		cacheRaw, 
		updateCacheRaw, 
		clearCacheRaw, 
		getPuzzleRaw,
		saveDecompress, 
		saveJsonUnzip, 
		decompressPuzzleId,
		parsePuzzleData, 
		resolvePuzzleData,
		createPuzzleId,
		fetchPuzzle,
	};
})();

// Export for vanilla JS/Parcel
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { PuzzleLoader };
} else if (typeof window !== 'undefined') {
	window.PuzzleLoader = PuzzleLoader;
}