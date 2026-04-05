import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    globals: true,
    timeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['services/**/*.js', 'index.js'],
      exclude: [
        'node_modules/',
        '**/*.db',
        'services/shared/',
      ],
    },
  },
});
