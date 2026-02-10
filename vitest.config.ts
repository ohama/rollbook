import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'node', // Use node environment for file-based tests
    globals: true,
    setupFiles: [],
    pool: 'threads',
    isolate: false,
  },
});
