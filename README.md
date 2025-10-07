<div align="center">
  <a href="https://vitejs.dev/">
    <img width="200" height="200" hspace="10" src="https://vitejs.dev/logo.svg" alt="vite logo" />
  </a>
  <h1>Vite Image Optimizer</h1>
  <p>
    Plugin for <a href="https://vitejs.dev/">Vite</a> to optimize all images assets using <a href="https://github.com/lovell/sharp">Sharp.js</a> and <a href="https://github.com/svg/svgo">SVGO</a> at build time.
  </p>
  <img src="https://img.shields.io/node/v/vite-plugin-image-optimizer" alt="node-current" />
  <img src="https://img.shields.io/npm/dependency-version/vite-plugin-image-optimizer/peer/vite" alt="npm peer dependency version" />
  <img src="https://img.shields.io/bundlephobia/minzip/vite-plugin-image-optimizer?label=minfied" alt="npm bundle size"/>
  <img src="https://img.shields.io/github/v/release/fatehak/vite-plugin-image-optimizer" alt="GitHub release" />
  <img src="https://img.shields.io/npm/l/vite-plugin-image-optimizer" alt="licence" />
</div>

<p>&nbsp;</p>

## Features

- Optimize SVG assets using [SVGO](https://github.com/svg/svgo) and pass custom configs.
- Optimize Raster assets (png, jpeg, gif, tiff, webp, avif) using [Sharp.js](https://github.com/lovell/sharp) with the option to pass custom configs for each extension type.
- Option to process all assets from your `public` directory defined in the bundler.
- Configure `test`, `include`, and `exclude` to filter assets.
- Caching support to avoid re-optimization (optional)
- Skips processing assets if their optimized size is greater than their original size.
- Log the optimization stats showing the before and after size difference, ratio and total savings (optional)
  ![terminal output image](https://images2.imgbox.com/6c/e7/DRpgWUM6_o.png)

## Motivation

This plugin is based on the awesome [image-minimizer-webpack-plugin](https://github.com/webpack-contrib/image-minimizer-webpack-plugin) for Webpack. I wanted to combine the
optimization capabilities of
**Sharp.js** and **SVGO** in a single package and I couldn't find a plugin
for Vite that could accomplish this. I initially thought of adding [squoosh](https://github.com/GoogleChromeLabs/squoosh) and [imagemin](https://github.com/imagemin/imagemin) support as well but
dropped the idea since they are no
longer
maintained.

If you find the plugin useful, consider showing your support by giving a ⭐

Contributions are most welcome! We follow [conventional-commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Installation

You can add it as a dev dependency to any of the package managers (NPM, Yarn, PNPM)

Supports `Vite >=3` and `Node >=14`

```console
npm install vite-plugin-image-optimizer --save-dev
```

> **Warning**
>
> `sharp` and `svgo` don't come installed as part of the package. You will have to install them manually and add it as a dev dependency. This is a design decision so you can choose to skip installing
> `sharp`
> if you only want to optimize svg assets using `svgo` and vice versa.
>
> ```console
> npm install sharp --save-dev
> ```
>
> ```console
> npm install svgo --save-dev
> ```

## Usage

```js
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      ViteImageOptimizer({
        /* pass your config */
      }),
    ],
  };
});
```

## Default Configuration

The default configuration is made for lossless compression of image assets.

```js
const DEFAULT_OPTIONS = {
  logStats: true,
  ansiColors: true,
  test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
  exclude: undefined,
  include: undefined,
  includePublic: true,
  svg: {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupNumericValues: false,
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
  },
  png: {
    // https://sharp.pixelplumbing.com/api-output#png
    quality: 100,
  },
  jpeg: {
    // https://sharp.pixelplumbing.com/api-output#jpeg
    quality: 100,
  },
  jpg: {
    // https://sharp.pixelplumbing.com/api-output#jpeg
    quality: 100,
  },
  tiff: {
    // https://sharp.pixelplumbing.com/api-output#tiff
    quality: 100,
  },
  // gif does not support lossless compression
  // https://sharp.pixelplumbing.com/api-output#gif
  gif: {},
  webp: {
    // https://sharp.pixelplumbing.com/api-output#webp
    lossless: true,
  },
  avif: {
    // https://sharp.pixelplumbing.com/api-output#avif
    lossless: true,
  },
  cache: false,
  cacheLocation: undefined,
};
```

## Plugin Options

- **[`test`](#test)**
- **[`include`](#include)**
- **[`exclude`](#exclude)**
- **[`includePublic`](#includepublic)**
- **[`logStats`](#logstats)**
- **[`ansiColors`](#ansiColors)**
- **[`svg`](#svg)**
- **[`png`](#png)**
- **[`jpeg`](#jpeg)**
- **[`tiff`](#tiff)**
- **[`gif`](#gif)**
- **[`webp`](#webp)**
- **[`avif`](#webp)**
- **[`cache`](#cache)**
- **[`cacheLocation`](#cache)**

### `test`

Type: `RegExp`

Default: `/\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i`

Test to match files against.

### `exclude`

Type: `String` | `RegExp` | `Array<string>`

Default: `undefined`

Files to exclude. `RegExp` can be used on the source path to exclude a particular folder (`exclude: /textures/`).

### `include`

Type: `String` | `RegExp` | `Array<string>`

Default: `undefined`

Files to include. `RegExp` can be used on the source path to include a particular folder (`include: /textures/`).

> **Warning**
>
> This will override any options set in `test` and `exclude` and has a higher preference. Use this option if you want to include specific assets only.

### `includePublic`

Type: `boolean`

Default: `true`

Include all assets within the public directory defined in Vite. When `true` it will recursively traverse the directory and optimize all the assets.

### `logStats`

Type: `boolean`

Default: `true`

Logs the optimization stats to terminal output with file size difference in kB, percent increase/decrease and total savings.

### `ansiColors`

Type: `boolean`

Default: `true`

Logs the optimization stats or errors with ansi colors in the terminal. Set it to `false` for shells that don't support color text.

### `svg`

Type: [`SVGOConfig`](https://github.com/svg/svgo/blob/main/lib/svgo.d.ts#L28)

Default:

```js
{
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
  ]
}
```

Config object to pass to SVGO, you can override it with your custom config.

### `png`

Type: [`PngOptions`](https://github.com/lovell/sharp/blob/main/lib/index.d.ts#L1200)

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#png
  quality: 100,
}
```

Config object to pass to Sharp.js for assets with `png` extension

### `jpeg`

Type: [`JpegOptions`](https://github.com/lovell/sharp/blob/main/lib/index.d.ts#L1060)

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#jpeg
  quality: 100,
}
```

Config object to pass to Sharp.js for assets with `jpg` or `jpeg` extension

### `gif`

Type: [`GifOptions`](https://github.com/lovell/sharp/blob/main/lib/index.d.ts#L1156)

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#gif
}
```

Config object to pass to Sharp.js for assets with `gif` extension

### `tiff`

Type: [`TiffOptions`](https://github.com/lovell/sharp/blob/main/lib/index.d.ts#L1175)

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#tiff
  quality: 100,
}
```

Config object to pass to Sharp.js for assets with `tiff` extension

### `webp`

Type: [`WebpOptions`](https://github.com/lovell/sharp/blob/main/lib/index.d.ts#L1113)

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#webp
  lossless: true,
}
```

Config object to pass to Sharp.js for assets with `webp` extension

### `avif`

Type: [`AvifOptions`](https://github.com/lovell/sharp/blob/main/lib/index.d.ts#L1132)

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#avif
  lossless: true,
}
```

Config object to pass to Sharp.js for assets with `avif` extension

### `cache`

Type: `boolean`

Default: `false`

Cache assets in `cacheLocation`. When enabled, reads and writes asset files with their hash suffix from the specified path.

### `cacheLocation`

Type: `String`

Default: `undefined`

Path to the cache directory. Can be used with GitHub Actions and other build servers that support cache directories to speed up consecutive builds.

## License

[MIT](./LICENSE)
