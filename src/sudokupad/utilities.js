// Adapted from https://github.com/marktekfan/sudokupad-penpa-import/blob/main/src/sudokupad/utilities.js
// Converted from ES6 modules to work with vanilla JS/Parcel

// System utilities
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const bind = (target, fn) => fn.bind(target);

const onEvent = (target, event, fn) => {
  target.addEventListener(event, fn);
  return () => target.removeEventListener(event, fn);
};

const onScroll = fn => onEvent(window, 'scroll', fn);

// File operations
const loadFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsText(file);
});

const downloadFile = (filename, data) => {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// Network utilities
const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

// Geometry calculations
const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

const getCenter = (x1, y1, x2, y2) => [(x1 + x2) / 2, (y2 + y1) / 2];

// Checksum utilities
const md5Digest = async (data) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('MD5', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Number utilities  
const numCompare = (a, b) => a - b;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Scroll utilities
const scrollToElement = (element, behavior = 'smooth') => {
  element.scrollIntoView({ behavior, block: 'center' });
};

const getScrollPercent = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  return scrollHeight > 0 ? scrollTop / scrollHeight : 0;
};

// SVG utilities
const createSVGElement = (tag, attributes = {}) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

// Export for vanilla JS/Parcel
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sleep,
    bind,
    onEvent,
    onScroll,
    loadFile,
    downloadFile,
    fetchWithTimeout,
    distance,
    angle,
    getCenter,
    md5Digest,
    numCompare,
    clamp,
    scrollToElement,
    getScrollPercent,
    createSVGElement
  };
} else if (typeof window !== 'undefined') {
  window.SudokuPadUtilities = {
    sleep,
    bind,
    onEvent,
    onScroll,
    loadFile,
    downloadFile,
    fetchWithTimeout,
    distance,
    angle,
    getCenter,
    md5Digest,
    numCompare,
    clamp,
    scrollToElement,
    getScrollPercent,
    createSVGElement
  };
}