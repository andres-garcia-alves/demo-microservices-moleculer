export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'mjs', 'json'],
  transform: {
    '^.+\\.m?[tj]sx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  globals: {
    'babel-jest': {
      useESM: true,
    },
  },
  collectCoverageFrom: ['services/**/*.js', 'index.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '\\.*\\.db$'],
  testMatch: ['**/__tests__/**/*.test.mjs', '**/?(*.)+(spec|test).mjs'],
};
