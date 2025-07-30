// Test puzzle data fixtures

export const SAMPLE_PUZZLE_URL = 'https://sudokupad.app/psxczr0jpr';
export const SAMPLE_CUSTOM_URL = 'https://sudokupad.app/pdyxs/whispers-in-the-mist';

export const SAMPLE_PUZZLE_DATA = {
  title: "Test Puzzle",
  puzzleId: "psxczr0jpr",
  originalData: {
    lines: [
      {
        color: "#ff0000ff",
        thickness: 2,
        wayPoints: [[1, 1], [2, 2], [3, 3]]
      },
      {
        color: "#00ff00ff", 
        thickness: 1,
        wayPoints: [[4, 4], [5, 5]]
      }
    ]
  },
  features: [
    {
      category: "lines",
      count: 2,
      visual: { color: "#ff0000ff" },
      customizable: {
        color: { default: "#ff0000ff" }
      },
      lines: [
        {
          color: "#ff0000ff",
          thickness: 2,
          wayPoints: [[1, 1], [2, 2], [3, 3]]
        }
      ]
    }
  ],
  totalLines: 2,
  featureGroups: 1
};

export const MOCK_API_RESPONSES = {
  validPuzzle: JSON.stringify(SAMPLE_PUZZLE_DATA.originalData),
  invalidPuzzle: null,
  networkError: new Error('Network error')
};