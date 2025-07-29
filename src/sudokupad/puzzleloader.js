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
				try {
					// Use PuzzleZipper.unzip like the reference implementation
					if (typeof PuzzleZipper !== 'undefined') {
						return JSON.parse(PuzzleZipper.unzip(data));
					}
					return data;
				}
				catch(err) {
					console.error('saveJsonUnzip:', err);
					return data;
				}
			}
		};

		const decompressPuzzleId = puzzleId => {
			let puzzle;
			puzzle = stripPuzzleFormat(puzzleId);
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

	// Puzzle format detection from reference implementation
		const PuzzleFormats = [
			{prefix: 'scl', alias: ['ctc']},
			{prefix: 'fpuz', alias: ['fpuzzles']},
			{prefix: 'scf'}
		];
		
		const createReAlias = ({prefix, alias}) => {
			const allPrefixes = [prefix, ...(alias || [])];
			const sortedPrefixes = [...new Set(allPrefixes)].sort((a, b) => b.length - a.length);
			return new RegExp(`^(${sortedPrefixes.join('|')})([\\s\\S]*)`, 'm');
		};
		
		// Initialize regex patterns for each format
		PuzzleFormats.forEach(pf => {
			pf.reAlias = createReAlias(pf);
		});
		
		const getPuzzleFormatInfo = (puzzleId = '') => {
			for(const pf of PuzzleFormats) {
				if(pf.reAlias.test(puzzleId)) return pf;
			}
		};
		
		const stripPuzzleFormat = puzzleId => {
			const pf = getPuzzleFormatInfo(puzzleId);
			if(pf) return puzzleId.match(pf.reAlias)[2];
			return puzzleId;
		};
		
		const isRemotePuzzleId = puzzleId => {
			const pf = getPuzzleFormatInfo(puzzleId);
			if(pf) return false;
			return true;
		};

	// Fetch
		const fetchPuzzle = async (puzzleId, opts = {timeout: 10000}) => {
			// If it's not a remote puzzle ID, return as is
			if(!isRemotePuzzleId(puzzleId)) {
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
		getPuzzleFormatInfo,
		stripPuzzleFormat,
		isRemotePuzzleId,
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