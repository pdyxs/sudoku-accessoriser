// Mock SudokuPad API responses for testing

// Sample puzzle data based on the real API response format
const MOCK_PUZZLE_DATA = {
  psxczr0jpr: {
    title: 'Test Whispers Puzzle',
    data: {
      lines: [
        {
          color: '#ff0000ff',
          thickness: 2,
          wayPoints: [
            [1, 1],
            [2, 2],
            [3, 3],
          ],
        },
        {
          color: '#00ff00ff',
          thickness: 1,
          wayPoints: [
            [4, 4],
            [5, 5],
          ],
        },
      ],
      grid: Array(9)
        .fill()
        .map(() => Array(9).fill(0)),
    },
  },
  'pdyxs/whispers-in-the-mist': {
    title: 'Whispers in the Mist',
    data: {
      lines: [
        {
          color: '#8B4513ff',
          thickness: 3,
          wayPoints: [
            [0, 0],
            [1, 1],
            [2, 0],
          ],
        },
      ],
      grid: Array(9)
        .fill()
        .map(() => Array(9).fill(0)),
    },
  },
};

/**
 * Mock fetch responses for SudokuPad API endpoints
 * @param {string} url - The API URL being requested
 * @returns {Promise} Mock response
 */
function mockSudokuPadAPI(url) {
  console.log('Mock API call:', url);

  // Extract puzzle ID from different URL formats
  let puzzleId = null;

  if (url.includes('sudokupad.app/api/puzzle/')) {
    puzzleId = decodeURIComponent(url.split('/api/puzzle/')[1]);
  } else if (url.includes('sudokupad.svencodes.com/ctclegacy/')) {
    puzzleId = decodeURIComponent(url.split('/ctclegacy/')[1]);
  } else if (url.includes('firebasestorage.googleapis.com')) {
    const match = url.match(/o\/([^?]+)/);
    if (match) {
      puzzleId = decodeURIComponent(match[1]);
    }
  }

  console.log('Extracted puzzle ID:', puzzleId);

  // Return mock data if we have it
  if (puzzleId && MOCK_PUZZLE_DATA[puzzleId]) {
    const mockData = MOCK_PUZZLE_DATA[puzzleId];
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            ...mockData.data,
            metadata: { title: mockData.title },
          })
        ),
      json: () =>
        Promise.resolve({
          ...mockData.data,
          metadata: { title: mockData.title },
        }),
    });
  }

  // Return rejection for unknown puzzles to simulate network failure
  return Promise.reject(new Error('Puzzle not found'));
}

/**
 * Setup fetch mock with SudokuPad API behavior
 */
function setupSudokuPadAPIMock() {
  global.fetch = jest.fn().mockImplementation(mockSudokuPadAPI);
}

/**
 * Add a mock puzzle for testing
 * @param {string} puzzleId - The puzzle ID
 * @param {object} puzzleData - The puzzle data
 */
function addMockPuzzle(puzzleId, puzzleData) {
  MOCK_PUZZLE_DATA[puzzleId] = puzzleData;
}

/**
 * Clear all mock puzzles
 */
function clearMockPuzzles() {
  Object.keys(MOCK_PUZZLE_DATA).forEach(key => {
    if (!['psxczr0jpr', 'pdyxs/whispers-in-the-mist'].includes(key)) {
      delete MOCK_PUZZLE_DATA[key];
    }
  });
}

module.exports = {
  mockSudokuPadAPI,
  setupSudokuPadAPIMock,
  addMockPuzzle,
  clearMockPuzzles,
  MOCK_PUZZLE_DATA,
};
