import type { Config as SVGOConfig } from 'svgo';
import type { PngOptions, JpegOptions, TiffOptions, GifOptions, WebpOptions, AvifOptions } from 'sharp';

export const VITE_PLUGIN_NAME = 'vite-plugin-image-optimizer';

const SVGO_CONFIG: SVGOConfig = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupNumericValues: false,
          removeViewBox: false, // https://github.com/svg/svgo/issues/1128
          cleanupIds: {
            minify: false,
            remove: false,
          },
          convertPathData: false,
        },
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
};

export const DEFAULT_OPTIONS = {
  logStats: true,
  ansiColors: true,
  includePublic: true,
  exclude: undefined,
  include: undefined,
  test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
  svg: SVGO_CONFIG,
  png: {
    // https://sharp.pixelplumbing.com/api-output#png
    quality: 100,
  } as PngOptions,
  jpeg: {
    // https://sharp.pixelplumbing.com/api-output#jpeg
    quality: 100,
  } as JpegOptions,
  jpg: {
    // https://sharp.pixelplumbing.com/api-output#jpeg
    quality: 100,
  } as JpegOptions,
  tiff: {
    // https://sharp.pixelplumbing.com/api-output#tiff
    quality: 100,
  } as TiffOptions,
  // gif does not support lossless compression
  // https://sharp.pixelplumbing.com/api-output#gif
  gif: {} as GifOptions,
  webp: {
    // https://sharp.pixelplumbing.com/api-output#webp
    lossless: true,
  } as WebpOptions,
  avif: {
    // https://sharp.pixelplumbing.com/api-output#avif
    lossless: true,
  } as AvifOptions,
  cache: false,
  cacheLocation: undefined,
};
