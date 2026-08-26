import { defineConfig } from 'vitest/config';

const e2eRequested = process.argv.slice(2).some((arg) => arg.replace(/\\/g, '/').includes('test/e2e'));

export default defineConfig({
  test: {
    include: e2eRequested ? ['test/e2e/**/*.test.ts'] : ['test/**/*.test.ts'],
    exclude: e2eRequested ? ['**/node_modules/**'] : ['**/node_modules/**', 'test/e2e/**'],
  },
});
