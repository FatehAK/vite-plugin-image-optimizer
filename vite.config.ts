import { resolve } from 'path';
import { defineConfig, type LibraryFormats } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

/** @type {import('vite').UserConfig} */
export default defineConfig(() => {
  return {
    plugins: [
      dts({
        insertTypesEntry: true,
        copyDtsFiles: true,
      }),
    ],
    build: {
      minify: false,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'ViteImageOptimizer',
        formats: ['es', 'cjs'] as LibraryFormats[],
        fileName: 'index',
      },
      rollupOptions: {
        external: ['fs', 'fs/promises', 'svgo', 'sharp', ...Object.keys(pkg.dependencies)],
        plugins: [
          visualizer({
            filename: 'reports/build-stats.html',
            gzipSize: true,
            brotliSize: true,
          }),
        ],
        output: {
          globals: {
            fs: 'fs',
            'fs/promises': 'fsp',
            svgo: 'svgo',
            sharp: 'sharp',
          },
        },
      },
    },
  };
});
