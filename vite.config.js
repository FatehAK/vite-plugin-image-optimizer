import { resolve } from 'path';
import strip from '@rollup/plugin-strip';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  console.log(`✨ Running in ${isProd ? 'Production' : 'Development'}.\n`);

  return {
    build: {
      minify: isProd ? 'esbuild' : false,
      lib: {
        entry: resolve(__dirname, 'src/index.js'),
        name: 'ViteImageOptimizer',
        formats: ['es', 'cjs'],
        fileName: 'index',
      },
      rollupOptions: {
        external: ['fs', 'fs/promises'],
        plugins: [
          isProd && strip(),
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
          },
        },
      },
    },
  };
});
