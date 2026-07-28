import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test', override: true });

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    globalSetup: './vitest.global.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
