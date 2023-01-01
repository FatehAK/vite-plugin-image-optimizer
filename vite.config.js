import { resolve } from 'path';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => {
  return {
    build: {
      minify: false,
      lib: {
        entry: resolve(__dirname, 'src/index.js'),
        name: 'ViteImageOptimizer',
        formats: ['es', 'cjs'],
        fileName: 'index',
      },
      rollupOptions: {
        external: ['fs', 'fs/promises', 'svgo', 'sharp'],
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
