// Adapted from https://github.com/marktekfan/sudokupad-penpa-import/blob/main/src/sudokupad/puzzlezipper.js
// Converted from ES6 modules to work with vanilla JS/Parcel

const PuzzleZipper = (() => {
	const propMap = {
		color: 'c',
		cages: 'ca',
		center: 'ct',
		borderColor: 'c1',
		backgroundColor: 'c2',
		cells: 'ce',
		cellSize: 'cs',
		arrows: 'a',
		overlays: 'o',
		underlays: 'u',
		width: 'w',
		height: 'h',
		value: 'v',
		videos: 'vd',
		lines: 'l',
		rounded: 'r',
		regions: 're',
		fontSize: 'fs',
		thickness: 'th',
		headLength: 'hl',
		wayPoints: 'wp',
		title: 't',
		text: 'te',
		duration: 'd',
		d: 'd2',
	}
	const clearEmptyArrays = o => {
		if(Array.isArray(o)) o.forEach(v => clearEmptyArrays(v));
		else if(o !== null && typeof o === 'object') {
			Object.keys(o).forEach(key => {
				clearEmptyArrays(o[key]);
				if(Array.isArray(o[key]) && o[key].length === 0) delete o[key];
			});
		}
		return o;
	};
	const mapProps = (o, map) => {
		if(Array.isArray(o)) o.forEach(v => mapProps(v, map));
		else if(o !== null && typeof o === 'object') {
			Object.keys(o).forEach(key => {
				if(map[key] !== undefined) {
					if(o[map[key]] !== undefined) throw new Error('Prop mapping collission from '+key+': '+o[key]+' to '+map[key]+': '+o[map[key]]);
					o[map[key]] = o[key];
					delete o[key];
					key = map[key];
				}
				mapProps(o[key], map);
			});
		}
		return o;
	};
	const mapValues = (o, mapFunc) => {
		if(Array.isArray(o)) o.forEach((v, idx) => o[idx] = mapValues(v, mapFunc));
		else if(o !== null && typeof o === 'object') {
			Object.keys(o).forEach(key => o[key] = mapValues(o[key], mapFunc));
		}
		else {
			o = mapFunc(o);
		}
		return o;
	};
	const zipQuotes = str => str.replace(/\'/g, '\\\'').replace(/"/g, '\'');
	const unzipQuotes = str => (str.indexOf('"') !== -1) ? str : str.replace(/(?!<\\)\\'/g, "'").replace(/'/g, '"').replace(/'/g, "'");
	const zipPuzzle = jsonStr => {
		if(typeof jsonStr !== 'string') jsonStr = JSON.stringify(jsonStr);
		var zipped = JSON.parse(jsonStr);
		clearEmptyArrays(zipped);
		mapProps(zipped, propMap);
		mapValues(zipped, v => {
			if(typeof v === 'string' && String(parseInt(v)) === v && v !== "NaN") v = parseInt(v);
			return v;
		});
		zipped = JSON.stringify(zipped)
			.replace(/([\,\{\[])\"([a-zA-Z0-9]+)\"\:/mg, '$1$2:')
			.replace(/([\,\{\[]){}(?=[,\}\]])/mg, '$1')
			.replace(/(:)false([,\}\]])/mg, '$1f$2')
			.replace(/(:)true([,\}\]])/mg, '$1t$2')
			.replace(/(:)"#000000"([,\}\]])/mg, '$1#0$2')
			.replace(/(:)"#FFFFFF"([,\}\]])/mg, '$1#F$2')
			.replace(/(:)"#([0-9a-fA-F]{6})"([,\}\]])/mg, '$1$2$3')
			;
		zipped = zipQuotes(zipped);
		return zipped;
	};
	const reQuotedStringSplit = /("(?:[^"]|\\"])*")/gm;
	const reQuotedMarkerSplit = /("__{S[0-9]+}__")/;
	const reQuotedMarker = /"__{S([0-9]+)}__"/;
	const extractStrings = str => {
		let split = str.split(reQuotedStringSplit);
		return {
			str: split.map((s, i) => i % 2 ? `"__{S${Math.floor(i / 2)}}__"` : s).join(''),
			strings: split.filter((s, i) => i % 2)
		};
	};
	const injectStrings = (str, strings) => {
		let split = str.split(reQuotedMarkerSplit);
		return split.map(str => {
			let m = str.match(reQuotedMarker);
			return (m !== null) ? strings[parseInt(m[1])] : str;
		}).join('');
	};
	const unzipPuzzle = zipped => {
		zipped = unzipQuotes(zipped);
		let extracted = extractStrings(zipped);
		zipped = extracted.str;
		zipped = zipped
			.replace(/([\,\{\[])([a-zA-Z0-9]+)\:/mg, '$1"$2":')
			.replace(/([\,\{\[])(?=[,\}\]])/mg, '$1_')
			.replace(/{_}/mg, '{}')
			.replace(/([\,\{\[])_/mg, '$1{}')
			.replace(/(:)f([,\}\]])/mg, '$1false$2')
			.replace(/(:)t([,\}\]])/mg, '$1true$2')
			.replace(/(:)#0([,\}\]])/mg, '$1"#000000"$2')
			.replace(/(:)#F([,\}\]])/mg, '$1"#FFFFFF"$2')
			.replace(/(:)([0-9a-fA-F]{6})([,\}\]])/mg, '$1"#$2"$3')
			;
		zipped = injectStrings(zipped, extracted.strings);
		const unzipped = JSON.parse(zipped);
		const revMap = {};
		Object.keys(propMap).forEach(key => revMap[propMap[key]] = key);
		mapProps(unzipped, revMap);
		mapValues(unzipped, v => {
			if(typeof v === 'string' && v.match(/^([0-9a-fA-F]{6})$/)){
				v = v.replace(/^([0-9a-fA-F]{6})$/, '#$1')
			}
			return v;
		});
		return JSON.stringify(unzipped);
	};
	return {
		propMap,
		zip: zipPuzzle,
		unzip: unzipPuzzle,
		zipQuotes, 
		unzipQuotes
	};
})();

// Export for vanilla JS/Parcel
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { PuzzleZipper };
} else if (typeof window !== 'undefined') {
	window.PuzzleZipper = PuzzleZipper;
}