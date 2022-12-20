import { basename } from 'pathe';
import chalk from 'chalk';
import { optimize } from 'svgo';

const VITE_PLUGIN_NAME = 'vite-plugin-image-optimizer';
const fileRegex = /\.svg$/;
const defaultOpts = {
  stats: true,
  svgoConfig: {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupNumericValues: false,
            removeViewBox: false, // https://github.com/svg/svgo/issues/1128
          },
          cleanupIDs: {
            minify: false,
            remove: false,
          },
          convertPathData: false,
        },
      },
      'sortAttrs',
      {
        name: 'addAttributesToSVGElement',
        params: {
          attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
        },
      },
    ],
  },
};

export default function (options = {}) {
  let rootConfig;

  const { stats = defaultOpts.stats, svgoConfig = defaultOpts.svgoConfig } = options;
  const sizesMap = new Map();

  return {
    name: VITE_PLUGIN_NAME,
    enforce: 'post',
    apply: 'build',
    configResolved(c) {
      rootConfig = c;
    },
    generateBundle: async (op, bundler) => {
      const processFile = async (filePath, buffer) => {
        try {
          const result = optimize(buffer.toString(), {
            path: filePath,
            ...svgoConfig,
          });

          const newBuffer = Buffer.from(result.data);
          const newSize = newBuffer.byteLength;
          const oldSize = buffer.byteLength;
          const skipWrite = newSize >= oldSize;
          // save the sizes of the old and new image
          sizesMap.set(filePath, {
            size: newSize / 1024,
            oldSize: oldSize / 1024,
            ratio: Math.floor(100 * (newSize / oldSize - 1)),
            skipWrite,
          });

          return { buffer: newBuffer, skipWrite };
        } catch (error) {
          rootConfig.logger.error(`${error.name} for '${filePath}' - ${error.reason}`);
          return undefined;
        }
      };

      const files = [];

      Object.keys(bundler).forEach(filePath => {
        if (fileRegex.test(filePath)) {
          files.push(filePath);
        }
      });

      if (files.length > 0) {
        await Promise.all(
          files.map(async filePath => {
            const source = bundler[filePath].source;
            const { buffer, skipWrite } = await processFile(filePath, source);
            if (buffer?.length > 0 && !skipWrite) {
              bundler[filePath].source = buffer;
            }
          })
        );
      }
    },
    async closeBundle() {
      if (stats) logOptimizationStats(rootConfig, sizesMap);
    },
  };
}

function logOptimizationStats(rootConfig, sizesMap) {
  rootConfig.logger.info(
    `\n${chalk.cyan('✨ [vite-plugin-image-optimizer]')} - optimized image resources successfully: `
  );

  const keyLengths = Array.from(sizesMap.keys(), name => name.length);
  const valueLengths = Array.from(sizesMap.values(), value => `${Math.floor(100 * value.ratio)}`.length);

  const maxKeyLength = Math.max(...keyLengths);
  const valueKeyLength = Math.max(...valueLengths);
  sizesMap.forEach((value, name) => {
    const { size, oldSize, ratio, skipWrite } = value;

    const percentChange = ratio > 0 ? chalk.red(`+${ratio}%`) : ratio <= 0 ? chalk.green(`${ratio}%`) : '';

    rootConfig.logger.info(
      chalk.dim(basename(rootConfig.build.outDir)) +
        '/' +
        chalk.blueBright(name) +
        ' '.repeat(2 + maxKeyLength - name.length) +
        chalk.gray(`${percentChange} ${' '.repeat(valueKeyLength - `${ratio}`.length)}`) +
        ' ' +
        chalk.dim(
          skipWrite
            ? `${chalk.yellow.bold('skipped')} ${size.toFixed(2)}kb >= original: ${oldSize.toFixed(2)}kb`
            : `${oldSize.toFixed(2)}kb / optimized: ${size.toFixed(2)}kb`
        )
    );
  });
  rootConfig.logger.info('\n');
}
