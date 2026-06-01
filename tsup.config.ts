import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts', 'src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  shims: true,
  banner: ({ format }) => {
    if (format === 'esm') {
      return { js: '#!/usr/bin/env node' };
    }
    return {};
  },
});
