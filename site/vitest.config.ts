import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      include: ['lib/validators/**/*.ts', 'lib/domain/**/*.ts', 'app/api/admin/**/*.ts'],
    },
  },
});

