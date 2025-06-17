import type { Plugin, ResolvedConfig } from 'vite';
import type { PngOptions, JpegOptions, TiffOptions, GifOptions, WebpOptions, AvifOptions, FormatEnum } from 'sharp';
import type { Config as SVGOConfig } from 'svgo';
import fs from 'fs';
import fsp from 'fs/promises';
import { dirname, extname, join, resolve, sep } from 'pathe';
import { filename } from 'pathe/utils';
import { merge, readAllFiles, areFilesMatching, logErrors, logOptimizationStats } from './utils';
import { VITE_PLUGIN_NAME, DEFAULT_OPTIONS } from './constants';
import type { convertAllToOptions } from './types'

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
   * convert all images to formats
   */
  convertAllTo?: convertAllToOptions | convertAllToOptions[];
  /**
   * include assets in public dir or not
   */
  includePublic?: boolean;
  /**
   * display logs using colors or not
   */
  ansiColors?: boolean;
  /**
   * log stats to the terminal or not
   */
  logStats?: boolean;
  /**
   * svgo opts
   */
  svg?: SVGOConfig;
  /**
   * sharp opts for png
   */
  png?: PngOptions;
  /**
   * sharp opts for jpeg
   */
  jpeg?: JpegOptions;
  /**
   * sharp opts for jpg
   */
  jpg?: JpegOptions;
  /**
   * sharp opts for tiff
   */
  tiff?: TiffOptions;
  /**
   * sharp opts for gif
   */
  gif?: GifOptions;
  /**
   * sharp opts for webp
   */
  webp?: WebpOptions;
  /**
   * sharp opts for avif
   */
  avif?: AvifOptions;
  /**
   * cache optimized images or not
   */
  cache?: boolean;
  /**
   * path to the cache directory
   */
  cacheLocation?: string;
}

function ViteImageOptimizer(optionsParam: Options = {}): Plugin {
  const options: Options = merge(optionsParam, DEFAULT_OPTIONS);

  let outputPath: string;
  let publicDir: string;
  let rootConfig: ResolvedConfig;
  let convertAllTo: convertAllToOptions[];

  const sizesMap = new Map<string, { size: number; oldSize: number; ratio: number; skipWrite: boolean; isCached: boolean, toFileExt: string }>();
  const mtimeCache = new Map<string, number>();
  const errorsMap = new Map<string, string>();

  if (options.convertAllTo) {
    convertAllTo = typeof options.convertAllTo === 'string' ? [options.convertAllTo] : options.convertAllTo;
    // check if formats are valid
    convertAllTo.forEach((format: string) => {
      if (format === 'svg') {
        throw new Error('Cannot convert bitmap images to svg.'); 
      }

      if (!options[format]) {
        throw new Error(`Cannot convert images to unrecognized format: ${format}`);
      }
    })
  }

  /* SVGO transformation */
  const applySVGO = async (filePath: string, buffer: Buffer): Promise<Buffer> => {
    const optimize = (await import('svgo')).optimize;
    return Buffer.from(
      optimize(buffer.toString(), {
        path: filePath,
        ...options.svg,
      }).data
    );
  };

  /* Sharp transformation */
  const applySharp = async (filePath: string, buffer: Buffer, toFileExt: string = null): Promise<Buffer> => {
    const sharp = (await import('sharp')).default;
    const extName: string = toFileExt || extname(filePath).replace('.', '').toLowerCase();
    return await sharp(buffer, { animated: extName === 'gif' })
      .toFormat(extName as keyof FormatEnum, options[extName])
      .toBuffer();
  };

  const processFile = async (filePath: string, buffer: Buffer, toFileExt: string = null) => {
    try {
      let newBuffer: Buffer;

      let isCached: boolean;
      let cachedFilePath = join(options.cacheLocation, filePath);
      if (toFileExt) {
        cachedFilePath += '.' + toFileExt;
      }

      if (options.cache === true && fs.existsSync(cachedFilePath)) {
        // load buffer from cache (when enabled and available)
        newBuffer = await fsp.readFile(cachedFilePath);
        isCached = true;
      } else {
        // create buffer from engine
        if (toFileExt === null) {
          const engine = /\.svg$/.test(filePath) ? applySVGO : applySharp;
          newBuffer = await engine(filePath, buffer);
        
        } else {
          newBuffer = await applySharp(filePath, buffer, toFileExt);
        }

        isCached = false;
      }

      // store buffer in cache
      if (options.cache === true && !isCached) {
        if (!fs.existsSync(dirname(cachedFilePath))) {
          await fsp.mkdir(dirname(cachedFilePath), { recursive: true });
        }
        await fsp.writeFile(cachedFilePath, newBuffer);
      }

      // calculate sizes
      const newSize: number = newBuffer.byteLength;
      const oldSize: number = buffer.byteLength;
      const skipWrite: boolean = newSize >= oldSize && !toFileExt;
      // save the sizes of the old and new image
      sizesMap.set(filePath, {
        size: newSize / 1024,
        oldSize: oldSize / 1024,
        ratio: Math.floor(100 * (newSize / oldSize - 1)),
        skipWrite,
        isCached,
        toFileExt,
      });

      return { content: newBuffer, skipWrite };
    } catch (error) {
      errorsMap.set(filePath, error.message);
      return {};
    }
  };

  const getFilesToProcess = (allFiles: string[], getFileName: Function) => {
    // include takes higher priority than `test` and `exclude`
    if (options.include) {
      return allFiles.reduce((acc, filePath) => {
        const fileName: string = getFileName(filePath);
        if (areFilesMatching(fileName, options.include)) {
          acc.push(filePath);
        }
        return acc;
      }, []);
    }

    return allFiles.reduce((acc, filePath) => {
      if (options.test?.test(filePath)) {
        const fileName: string = getFileName(filePath);
        if (!areFilesMatching(fileName, options.exclude)) {
          acc.push(filePath);
        }
      }
      return acc;
    }, []);
  };

  const ensureCacheDirectoryExists = async function () {
    if (options.cache === true && !fs.existsSync(options.cacheLocation)) {
      await fsp.mkdir(options.cacheLocation, { recursive: true });
    }
  };

  const convertFileToFormats = (filePath: string, buffer: Buffer) => {
    if (!convertAllTo) return [];

    const extName: string = extname(filePath).replace('.', '').toLowerCase();

    return convertAllTo
      .filter((format: string) => format !== extName)
      .map(async (format: string) => {
        const { content } = await processFile(filePath, buffer, format);
        return { content, format }
      })
  }

  return {
    name: VITE_PLUGIN_NAME,
    enforce: 'post',
    apply: 'build',
    configResolved(c) {
      rootConfig = c;
      outputPath = c.build.outDir;
      if (typeof c.publicDir === 'string') {
        publicDir = c.publicDir.replace(/\\/g, '/');
      }
    },
    generateBundle: async (_, bundler) => {
      const allFiles: string[] = Object.keys(bundler);
      const files: string[] = getFilesToProcess(allFiles, path => (bundler[path] as any).name);

      if (files.length > 0) {
        await ensureCacheDirectoryExists();

        const handles = files.map(async (filePath: string) => {
          const source = (bundler[filePath] as any).source;
          const { content, skipWrite } = await processFile(filePath, source);
          // write the file only if its optimized size < original size
          if (content?.length && !skipWrite) {
            (bundler[filePath] as any).source = content;
          }
          
          convertFileToFormats(filePath, source).forEach(async (converted) => {
            const { content, format } = await converted;
            if (content?.length) {
              (bundler[filePath + '.' + format] as any).source = content;
            }
          });
        });
        await Promise.all(handles);
      }
    },
    async closeBundle() {
      if (publicDir && options.includePublic) {
        // find static images in the original static folder
        const allFiles: string[] = readAllFiles(publicDir);
        const files: string[] = getFilesToProcess(allFiles, path => filename(path) + extname(path));

        if (files.length > 0) {
          await ensureCacheDirectoryExists();

          const handles = files.map(async (publicFilePath: string) => {
            // convert the path to the output folder
            const filePath: string = publicFilePath.replace(publicDir + sep, '');
            const fullFilePath: string = resolve(rootConfig.root, outputPath, filePath);

            if (fs.existsSync(fullFilePath) === false) return;

            const { mtimeMs } = await fsp.stat(fullFilePath);
            if (mtimeMs <= (mtimeCache.get(filePath) || 0)) return;

            const buffer: Buffer = await fsp.readFile(fullFilePath);
            const { content, skipWrite } = await processFile(filePath, buffer);
            // write the file only if its optimized size < original size
            if (content?.length > 0 && !skipWrite) {
              await fsp.writeFile(fullFilePath, content);
              mtimeCache.set(filePath, Date.now());
            }

            convertFileToFormats(filePath, buffer).forEach(async (converted) => {
              const { content, format } = await converted;
              if (content?.length) {
                await fsp.writeFile(fullFilePath + '.' + format, content);
                mtimeCache.set(filePath + '.' + format, Date.now());
              }
            });
          });
          await Promise.all(handles);
        }
      }
      if (sizesMap.size > 0 && options.logStats) {
        logOptimizationStats(rootConfig, sizesMap, options.ansiColors);
      }
      if (errorsMap.size > 0) {
        logErrors(rootConfig, errorsMap, options.ansiColors);
      }
    },
  };
}

export { ViteImageOptimizer };
