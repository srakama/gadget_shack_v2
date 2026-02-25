module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 20000,
  // Improve stability in CI and eliminate open-handle warnings
  detectOpenHandles: true,
  forceExit: true,
};

