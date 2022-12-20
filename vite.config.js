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
        name: 'index',
        formats: ['es', 'umd'],
        fileName: format => `index.${format}.js`,
      },
      rollupOptions: {
        plugins: [
          isProd && strip(),
          visualizer({
            filename: 'reports/build-stats.html',
            gzipSize: true,
            brotliSize: true,
          }),
        ],
      },
    },
  };
});
