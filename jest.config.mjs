export default {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/**/__tests__/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/__tests__/**/*.test.js'],
};
