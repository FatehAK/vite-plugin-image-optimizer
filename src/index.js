import { basename, join, sep } from 'pathe';
import fs from 'fs-extra';
import chalk from 'chalk';
import { optimize } from 'svgo';
import { readAllFiles } from './utils';

const VITE_PLUGIN_NAME = 'vite-plugin-image-optimizer';
const fileRegex = /\.svg$/;

const defaultOpts = {
  logStats: true,
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
  const { logStats = defaultOpts.logStats, svgoConfig = defaultOpts.svgoConfig } = options;

  let rootConfig, outputPath, publicDir;

  const sizesMap = new Map();
  const mtimeCache = new Map();

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

      return { content: newBuffer, skipWrite };
    } catch (error) {
      rootConfig.logger.error(`${error.name} for '${filePath}' - ${error.reason}`);
      return undefined;
    }
  };

  return {
    name: VITE_PLUGIN_NAME,
    enforce: 'post',
    apply: 'build',
    configResolved(c) {
      rootConfig = c;
      outputPath = c.build.outDir;
      if (typeof c.publicDir === 'string') {
        publicDir = c.publicDir;
      }
    },
    generateBundle: async (op, bundler) => {
      const files = [];

      Object.keys(bundler).forEach(filePath => {
        if (fileRegex.test(filePath)) {
          files.push(filePath);
        }
      });

      if (files.length > 0) {
        const handles = files.map(async filePath => {
          const source = bundler[filePath].source;
          const { content, skipWrite } = await processFile(filePath, source);
          if (content?.length > 0 && !skipWrite) {
            bundler[filePath].source = content;
          }
        });
        await Promise.all(handles);
      }
    },
    async closeBundle() {
      if (publicDir) {
        const files = [];

        // find static images in the original static folder
        readAllFiles(publicDir).forEach(filePath => {
          if (fileRegex.test(filePath)) {
            files.push(filePath);
          }
        });

        if (files.length > 0) {
          const handles = files.map(async publicFilePath => {
            // convert the path to the output folder
            const filePath = publicFilePath.replace(publicDir + sep, '');
            const fullFilePath = join(outputPath, filePath);

            if (fs.existsSync(fullFilePath) === false) {
              return;
            }
            const { mtimeMs } = await fs.stat(fullFilePath);
            if (mtimeMs <= (mtimeCache.get(filePath) || 0)) {
              return;
            }

            const buffer = await fs.readFile(fullFilePath);
            const { content, skipWrite } = await processFile(filePath, buffer);
            if (content?.length > 0 && !skipWrite) {
              await fs.writeFile(fullFilePath, content);
              mtimeCache.set(filePath, Date.now());
            }
          });

          await Promise.all(handles);
        }
      }
      if (logStats) {
        logOptimizationStats(rootConfig, sizesMap);
      }
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
