import type { Plugin, ResolvedConfig } from 'vite';
import fs from 'fs';
import fsp from 'fs/promises';
import { basename, extname, join, sep } from 'pathe';
import { filename } from 'pathe/utils';
import ansi from 'ansi-colors';
import { isRegex, merge, readAllFiles } from './utils';
import { VITE_PLUGIN_NAME, DEFAULT_OPTIONS } from './constants';

interface Options {
  /**
   * test to match files against
   */
  test?: RegExp;
  /**
   * files to include
   */
  include?: RegExp | string | string[];
  /**
   * files to exclude
   */
  exclude?: RegExp | string | string[];
  /**
   * include assets in public dir or not
   */
  includePublic?: boolean;
  /**
   * log stats to the terminal or not
   */
  logStats?: boolean;
  /**
   * svgo opts
   */
  svg?: any;
  /**
   * sharp opts for png
   */
  png?: any;
  /**
   * sharp opts for jpeg
   */
  jpeg?: any;
  /**
   * sharp opts for jpg
   */
  jpg?: any;
  /**
   * sharp opts for tiff
   */
  tiff?: any;
  /**
   * sharp opts for gif
   */
  gif?: any;
  /**
   * sharp opts for webp
   */
  webp?: any;
  /**
   * sharp opts for avif
   */
  avif?: any;
}

function ViteImageOptimizer(optionsParam: Options = {}): Plugin {
  const options: Options = merge(optionsParam, DEFAULT_OPTIONS);

  let outputPath: string;
  let publicDir: string;
  let rootConfig: ResolvedConfig;

  const sizesMap = new Map<string, { size: number; oldSize: number; ratio: number; skipWrite: boolean }>();
  const mtimeCache = new Map<string, number>();
  const errorsMap = new Map<string, string>();

  const applySVGO = async (filePath: string, buffer: Buffer): Promise<Buffer> => {
    const optimize = (await import('svgo')).optimize;

    return Buffer.from(
      optimize(buffer.toString(), {
        path: filePath,
        ...options.svg,
      }).data
    );
  };

  const applySharp = async (filePath: string, buffer: Buffer): Promise<Buffer> => {
    const sharp = (await import('sharp')).default;
    const extName: string = extname(filePath).replace('.', '');
    return await sharp(buffer, { animated: extName === 'gif' })
      .toFormat(extName, options[extName.toLowerCase()])
      .toBuffer();
  };

  const processFile = async (filePath: string, buffer: Buffer) => {
    try {
      const engine: Function = /\.svg$/.test(filePath) ? applySVGO : applySharp;
      const newBuffer: Buffer = await engine(filePath, buffer);

      const newSize: number = newBuffer.byteLength;
      const oldSize: number = buffer.byteLength;
      const skipWrite: boolean = newSize >= oldSize;
      // save the sizes of the old and new image
      sizesMap.set(filePath, {
        size: newSize / 1024,
        oldSize: oldSize / 1024,
        ratio: Math.floor(100 * (newSize / oldSize - 1)),
        skipWrite,
      });

      return { content: newBuffer, skipWrite };
    } catch (error) {
      errorsMap.set(filePath, error.message);
      return {};
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
    generateBundle: async (_, bundler) => {
      const files: string[] = [];
      const allFiles: string[] = Object.keys(bundler);
      if (options.include) {
        // include takes higher priority than `test` and `exclude`
        allFiles.forEach((filePath: string) => {
          const fileName: string = (bundler[filePath] as any).name;
          if (isIncludedFile(fileName, options.include)) {
            files.push(filePath);
          }
        });
      } else {
        allFiles.forEach((filePath: string) => {
          if (options.test.test(filePath)) {
            const fileName: string = (bundler[filePath] as any).name;
            if (!isExcludedFile(fileName, options.exclude)) {
              files.push(filePath);
            }
          }
        });
      }

      if (files.length > 0) {
        const handles = files.map(async (filePath: string) => {
          const source = (bundler[filePath] as any).source;
          const { content, skipWrite } = await processFile(filePath, source);
          if (content?.length > 0 && !skipWrite) {
            (bundler[filePath] as any).source = content;
          }
        });
        await Promise.all(handles);
      }
    },
    async closeBundle() {
      if (publicDir && options.includePublic) {
        const files: string[] = [];
        // find static images in the original static folder
        const allFiles: string[] = readAllFiles(publicDir);
        if (options.include) {
          // include takes higher priority than `test` and `exclude`
          allFiles.forEach((filePath: string) => {
            const fileName: string = filename(filePath) + extname(filePath);
            if (isIncludedFile(fileName, options.include)) {
              files.push(filePath);
            }
          });
        } else {
          allFiles.forEach((filePath: string) => {
            if (options.test.test(filePath)) {
              const fileName: string = filename(filePath) + extname(filePath);
              if (!isExcludedFile(fileName, options.exclude)) {
                files.push(filePath);
              }
            }
          });
        }

        if (files.length > 0) {
          const handles = files.map(async (publicFilePath: string) => {
            // convert the path to the output folder
            const filePath: string = publicFilePath.replace(publicDir + sep, '');
            const fullFilePath: string = join(outputPath, filePath);

            if (fs.existsSync(fullFilePath) === false) {
              return;
            }
            const { mtimeMs } = await fsp.stat(fullFilePath);
            if (mtimeMs <= (mtimeCache.get(filePath) || 0)) {
              return;
            }

            const buffer: Buffer = await fsp.readFile(fullFilePath);
            const { content, skipWrite } = await processFile(filePath, buffer);
            if (content?.length > 0 && !skipWrite) {
              await fsp.writeFile(fullFilePath, content);
              mtimeCache.set(filePath, Date.now());
            }
          });
          await Promise.all(handles);
        }
      }
      if (sizesMap.size > 0 && options.logStats) {
        logOptimizationStats(rootConfig, sizesMap);
      }
      if (errorsMap.size > 0) {
        logErrors(rootConfig, errorsMap);
      }
    },
  };
}

function isIncludedFile(fileName: string, include): boolean {
  return checkFileMatch(fileName, include);
}

function isExcludedFile(fileName: string, exclude): boolean {
  return checkFileMatch(fileName, exclude);
}

function checkFileMatch(fileName: string, matcher): boolean {
  const isString = Object.prototype.toString.call(matcher) === '[object String]';
  const isArray = Array.isArray(matcher);
  if (isString) {
    return fileName === matcher;
  }
  if (isRegex(matcher)) {
    return matcher.test(fileName);
  }
  if (isArray) {
    return matcher.includes(fileName);
  }
  return false;
}

function logErrors(rootConfig: ResolvedConfig, errorsMap: Map<string, string>) {
  rootConfig.logger.info(`\n🚨 ${ansi.red('[vite-plugin-image-optimizer]')} - errors during optimization for: `);

  const keyLengths: number[] = Array.from(errorsMap.keys(), (name: string) => name.length);
  const maxKeyLength: number = Math.max(...keyLengths);

  errorsMap.forEach((message: string, name: string) => {
    rootConfig.logger.error(
      `${ansi.dim(basename(rootConfig.build.outDir))}/${ansi.blueBright(name)}${' '.repeat(2 + maxKeyLength - name.length)} ${ansi.red(
        message
      )}`
    );
  });
  rootConfig.logger.info('\n');
}

function logOptimizationStats(
  rootConfig: ResolvedConfig,
  sizesMap: Map<string, { size: number; oldSize: number; ratio: number; skipWrite: boolean }>
) {
  rootConfig.logger.info(`\n✨ ${ansi.cyan('[vite-plugin-image-optimizer]')} - optimized image resources successfully: `);

  const keyLengths: number[] = Array.from(sizesMap.keys(), (name: string) => name.length);
  const valueLengths: number[] = Array.from(sizesMap.values(), (value: any) => `${Math.floor(100 * value.ratio)}`.length);

  const maxKeyLength: number = Math.max(...keyLengths);
  const valueKeyLength: number = Math.max(...valueLengths);
  sizesMap.forEach((value, name) => {
    const { size, oldSize, ratio, skipWrite } = value;

    const percentChange: string = ratio > 0 ? ansi.red(`+${ratio}%`) : ratio <= 0 ? ansi.green(`${ratio}%`) : '';

    const sizeText: string = skipWrite
      ? `${ansi.yellow.bold('skipped')} ${ansi.dim(`original: ${oldSize.toFixed(2)}kb <= optimized: ${size.toFixed(2)}kb`)}`
      : ansi.dim(`${oldSize.toFixed(2)}kb -> ${size.toFixed(2)}kb`);

    rootConfig.logger.info(
      ansi.dim(basename(rootConfig.build.outDir)) +
        '/' +
        ansi.blueBright(name) +
        ' '.repeat(2 + maxKeyLength - name.length) +
        ansi.gray(`${percentChange} ${' '.repeat(valueKeyLength - `${ratio}`.length)}`) +
        ' ' +
        sizeText
    );
  });
  rootConfig.logger.info('\n');
}

export { ViteImageOptimizer };
