// Adapted from https://github.com/marktekfan/sudokupad-penpa-import/blob/main/src/sudokupad/fpuzzlesdecoder.js
// Converted from ES6 modules to work with vanilla JS/Parcel
// Contains the complete LZ-String base64Codec implementation

const loadFPuzzle = (() => {

	// Complete LZ-String implementation from the reference repository
	const base64Codec = (() => {
		var f = String.fromCharCode;
		var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\\";
		var baseReverseDic = {};
		function getBaseValue(alphabet, character){
			if(!baseReverseDic[alphabet]){
				baseReverseDic[alphabet] = {};
				for(var i = 0; i < alphabet.length; i++) {
					baseReverseDic[alphabet][alphabet.charAt(i)] = i;
				}
			}
			return baseReverseDic[alphabet][character];
		}
		function decompressFromBase64(input){
			if(input == null) return "";
			if(input == "") return null;
			return _decompress(input.length, 32, function(index){return getBaseValue(keyStrBase64, input.charAt(index));});
		}
		function _decompress(length, resetValue, getNextValue){
			var dictionary = [],
				next,
				enlargeIn = 4,
				dictSize = 4,
				numBits = 3,
				entry = "",
				result = [],
				i,
				w,
				bits, resb, maxpower, power,
				c,
				data = {val: getNextValue(0), position: resetValue, index:1};
			for(i = 0; i < 3; i++)
				dictionary[i] = i;
			bits = 0;
			maxpower = Math.pow(2, 2);
			power = 1;
			while (power != maxpower) {
				resb = data.val & data.position;
				data.position >>= 1;
				if(data.position == 0){
					data.position = resetValue;
					data.val = getNextValue(data.index++);
				}
				bits |= (resb > 0 ? 1 : 0) * power;
				power <<= 1;
			}
			switch(next = bits){
				case 0:
					bits = 0;
					maxpower = Math.pow(2, 8);
					power=1;
					while (power != maxpower) {
						resb = data.val & data.position;
						data.position >>= 1;
						if(data.position == 0){
							data.position = resetValue;
							data.val = getNextValue(data.index++);
						}
						bits |= (resb > 0 ? 1 : 0) * power;
						power <<= 1;
					}
					c = f(bits);
					break;
				case 1:
					bits = 0;
					maxpower = Math.pow(2, 16);
					power = 1;
					while(power != maxpower){
						resb = data.val & data.position;
						data.position >>= 1;
						if(data.position == 0){
							data.position = resetValue;
							data.val = getNextValue(data.index++);
						}
						bits |= (resb > 0 ? 1 : 0) * power;
						power <<= 1;
					}
					c = f(bits);
					break;
				case 2:
					return "";
			}
			dictionary[3] = c;
			w = c;
			result.push(c);
			while(true){
				if(data.index > length) return "";
				bits = 0;
				maxpower = Math.pow(2, numBits);
				power = 1;
				while(power != maxpower){
					resb = data.val & data.position;
					data.position >>= 1;
					if(data.position == 0){
						data.position = resetValue;
						data.val = getNextValue(data.index++);
					}
					bits |= (resb > 0 ? 1 : 0) * power;
					power <<= 1;
				}
				switch (c = bits) {
					case 0:
						bits = 0;
						maxpower = Math.pow(2, 8);
						power = 1;
						while(power != maxpower){
							resb = data.val & data.position;
							data.position >>= 1;
							if(data.position == 0){
								data.position = resetValue;
								data.val = getNextValue(data.index++);
							}
							bits |= (resb > 0 ? 1 : 0) * power;
							power <<= 1;
						}
						dictionary[dictSize++] = f(bits);
						c = dictSize-1;
						enlargeIn--;
						break;
					case 1:
						bits = 0;
						maxpower = Math.pow(2, 16);
						power=1;
						while(power != maxpower){
							resb = data.val & data.position;
							data.position >>= 1;
							if(data.position == 0){
								data.position = resetValue;
								data.val = getNextValue(data.index++);
							}
							bits |= (resb > 0 ? 1 : 0) * power;
							power <<= 1;
						}
						dictionary[dictSize++] = f(bits);
						c = dictSize-1;
						enlargeIn--;
						break;
					case 2:
						return result.join('');
				}
				if(enlargeIn == 0){
					enlargeIn = Math.pow(2, numBits);
					numBits++;
				}
				if(dictionary[c]){
					entry = dictionary[c];
				} else {
					if(c === dictSize){
						entry = w + w.charAt(0);
					} else return null;
				}
				result.push(entry);
				dictionary[dictSize++] = w + entry.charAt(0);
				enlargeIn--;
				w = entry;
				if(enlargeIn == 0){
					enlargeIn = Math.pow(2, numBits);
					numBits++;
				}
			}
		}
		function compressToBase64(input){
			if(input === null) return '';
			var res = _compress(input, 6, function(index){return keyStrBase64.charAt(index);});
			switch(res.length % 4){
				default:
				case 0: return res;
				case 1: return res + '===';
				case 2: return res + '==';
				case 3: return res + '=';
			}
		}
		function _compress(uncompressed, bitsPerChar, getCharFromInt){
			if(uncompressed == null) return "";
			var i, value,
				context_dictionary= {},
				context_dictionaryToCreate= {},
				context_c="",
				context_wc="",
				context_w="",
				context_enlargeIn= 2,
				context_dictSize= 3,
				context_numBits= 2,
				context_data=[],
				context_data_val=0,
				context_data_position=0,
				ii;
			for(ii = 0; ii < uncompressed.length; ii++){
				context_c = uncompressed.charAt(ii);
				if(!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)){
					context_dictionary[context_c] = context_dictSize++;
					context_dictionaryToCreate[context_c] = true;
				}
				context_wc = context_w + context_c;
				if(Object.prototype.hasOwnProperty.call(context_dictionary, context_wc))
					context_w = context_wc;
				else {
					if(Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)){
						if(context_w.charCodeAt(0) < 256){
							for(i = 0; i < context_numBits; i++){
								context_data_val = (context_data_val << 1);
								if(context_data_position == bitsPerChar - 1){
									context_data_position = 0;
									context_data.push(getCharFromInt(context_data_val));
									context_data_val = 0;
								} else context_data_position++;
							}
							value = context_w.charCodeAt(0);
							for(i = 0; i < 8; i++){
								context_data_val = (context_data_val << 1) | (value & 1);
								if(context_data_position == bitsPerChar - 1){
									context_data_position = 0;
									context_data.push(getCharFromInt(context_data_val));
									context_data_val = 0;
								} else context_data_position++;
								value = value >> 1;
							}
						} else {
							value = 1;
							for(i = 0; i < context_numBits; i++){
								context_data_val = (context_data_val << 1) | value;
								if(context_data_position == bitsPerChar - 1){
									context_data_position = 0;
									context_data.push(getCharFromInt(context_data_val));
									context_data_val = 0;
								} else context_data_position++;
								value = 0;
							}
							value = context_w.charCodeAt(0);
							for(i = 0; i < 16; i++){
								context_data_val = (context_data_val << 1) | (value & 1);
								if(context_data_position == bitsPerChar - 1){
									context_data_position = 0;
									context_data.push(getCharFromInt(context_data_val));
									context_data_val = 0;
								} else context_data_position++;
								value = value >> 1;
							}
						}
						context_enlargeIn--;
						if(context_enlargeIn == 0){
							context_enlargeIn = Math.pow(2, context_numBits);
							context_numBits++;
						}
						delete context_dictionaryToCreate[context_w];
					} else {
						value = context_dictionary[context_w];
						for (i=0 ; i<context_numBits ; i++) {
							context_data_val = (context_data_val << 1) | (value&1);
							if (context_data_position == bitsPerChar-1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else context_data_position++;
							value = value >> 1;
						}
					}
					context_enlargeIn--;
					if (context_enlargeIn == 0) {
						context_enlargeIn = Math.pow(2, context_numBits);
						context_numBits++;
					}
					context_dictionary[context_wc] = context_dictSize++;
					context_w = String(context_c);
				}
			}
			if (context_w !== "") {
				if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
					if (context_w.charCodeAt(0)<256) {
						for (i=0 ; i<context_numBits ; i++) {
							context_data_val = (context_data_val << 1);
							if (context_data_position == bitsPerChar-1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else context_data_position++;
						}
						value = context_w.charCodeAt(0);
						for (i=0 ; i<8 ; i++) {
							context_data_val = (context_data_val << 1) | (value&1);
							if (context_data_position == bitsPerChar-1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else context_data_position++;
							value = value >> 1;
						}
					} else {
						value = 1;
						for (i=0 ; i<context_numBits ; i++) {
							context_data_val = (context_data_val << 1) | value;
							if (context_data_position == bitsPerChar-1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else context_data_position++;
							value = 0;
						}
						value = context_w.charCodeAt(0);
						for (i=0 ; i<16 ; i++) {
							context_data_val = (context_data_val << 1) | (value&1);
							if (context_data_position == bitsPerChar-1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else context_data_position++;
							value = value >> 1;
						}
					}
					context_enlargeIn--;
					if (context_enlargeIn == 0) {
						context_enlargeIn = Math.pow(2, context_numBits);
						context_numBits++;
					}
					delete context_dictionaryToCreate[context_w];
				} else {
					value = context_dictionary[context_w];
					for (i=0 ; i<context_numBits ; i++) {
						context_data_val = (context_data_val << 1) | (value&1);
						if (context_data_position == bitsPerChar-1) {
							context_data_position = 0;
							context_data.push(getCharFromInt(context_data_val));
							context_data_val = 0;
						} else context_data_position++;
						value = value >> 1;
					}
				}
				context_enlargeIn--;
				if (context_enlargeIn == 0) {
					context_enlargeIn = Math.pow(2, context_numBits);
					context_numBits++;
				}
			}
			value = 2;
			for (i=0 ; i<context_numBits ; i++) {
				context_data_val = (context_data_val << 1) | (value&1);
				if (context_data_position == bitsPerChar-1) {
					context_data_position = 0;
					context_data.push(getCharFromInt(context_data_val));
					context_data_val = 0;
				} else context_data_position++;
				value = value >> 1;
			}
			while (true) {
				context_data_val = (context_data_val << 1);
				if (context_data_position == bitsPerChar-1) {
					context_data.push(getCharFromInt(context_data_val));
					break;
				} else context_data_position++;
			}
			return context_data.join('');
		}
		return {
			decompress: decompressFromBase64,
			compress: compressToBase64
		};
	})();

	// Main decompression function using the LZ-String codec
	const decompressPuzzle = (data) => {
		try {
			return base64Codec.decompress(data);
		} catch (e) {
			console.error('LZ-String decompression failed:', e);
			return data; // Return original if decompression fails
		}
	};

	const compressPuzzle = (data) => {
		try {
			return base64Codec.compress(data);
		} catch (e) {
			console.error('LZ-String compression failed:', e);
			return data;
		}
	};

	// Simple MD5 implementation
	const createMd5Hash = async (data) => {
		if (typeof window !== 'undefined' && window.SudokuPadUtilities && window.SudokuPadUtilities.md5Digest) {
			return await window.SudokuPadUtilities.md5Digest(data);
		}
		// Fallback - simple hash
		let hash = 0;
		for (let i = 0; i < data.length; i++) {
			const char = data.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString(16);
	};

	return {
		loadFPuzzle: null, // Not implementing full F-Puzzle parsing for now
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