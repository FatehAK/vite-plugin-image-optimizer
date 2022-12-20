import { optimize } from 'svgo';

const VITE_PLUGIN_NAME = 'vite-plugin-image-optimizer';
const fileRegex = /\.svg$/;
const defaultOptions = {
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
            ...(options.svgoConfig ?? defaultOptions.svgoConfig),
          });

          const newBuffer = Buffer.from(result.data);
          console.log('## new: ', newBuffer.byteLength);
          console.log('## old: ', buffer.byteLength);

          return newBuffer;
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
            const content = await processFile(filePath, source);
            if (content?.length > 0) {
              bundler[filePath].source = content;
            }
          })
        );
      }
    },
  };
}
