<div align="center">
  <a href="https://vitejs.dev/">
    <img width="200" height="200" hspace="10"
      src="https://vitejs.dev/logo.svg">
  </a>
  <h1>Image Optimizer Vite</h1>
  <p>
    Plugin for <a href="https://vitejs.dev/">Vite</a> to optimize (compress) all images assets using <a href="https://github.com/lovell/sharp">Sharp.js</a> and <a href="https://github.com/svg/svgo">SVGO</a> at build time.
  </p>
</div>

## vite-plugin-image-optimizer

### Features

- Optimize SVG assets using [SVGO](https://github.com/lovell/sharp) with the abilty to pass a custom config.
- Optimize scalar assets (jpeg, png, gif, webp, avif) using [Sharp.js](https://github.com/lovell/sharp) with option to pass custom configs for each extension type.
- Option to process all assets from your `/public` directory.
- Configure `test`, `include` and `exclude` to filter assets.
- Skip processing assets if their optimized size is greater than their original size.
- Log the optimization stats showing the before and after size difference and ratio (optional)

### Installation

- NPM

```console
npm install vite-plugin-image-optimizer --save-dev
```

- Yarn

```console
yarn add -D vite-plugin-image-optimizer
```

- PNPM

```console
pnpm add -D vite-plugin-image-optimizer
```

### Default Configuration

The default configuration is made for lossless compression of image assets.

```js
const DEFAULT_OPTIONS = {
  test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
  exclude: undefined,
  include: undefined,
  includePublic: true,
  logStats: true,
  svg: {
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
};
```

### Plugin Options

- **[`test`](#test)**
- **[`include`](#include)**
- **[`exclude`](#exclude)**
- **[`includePublic`](#includepublic)**
- **[`logStats`](#logstats)**
- **[`svg`](#svg)**
- **[`png`](#png)**
- **[`jpeg`](#jpeg)**
- **[`tiff`](#tiff)**
- **[`gif`](#gif)**
- **[`webp`](#webp)**
- **[`avif`](#webp)**

### `test`

Type: `RegExp`

Default: `/\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i`

Test to match files against.

### `exclude`

Type: `String` | `RegExp` | `Array<string>`

Default: `undefined`

Files to exclude.

### `include`

Type: `String` | `RegExp` | `Array<string>`

Default: `undefined`

Files to include.

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

Logs the optimization stats to terminal output with file size difference in kB and percent increase/decrease.

### `svg`

Type: `Object`

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

Type: `Object`

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#png
  quality: 100;
}
```

Config object to pass to Sharp.js for assets with `png` extension

### `jpeg`

Type: `Object`

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#jpeg
  quality: 100;
}
```

Config object to pass to Sharp.js for assets with `jpg` or `jpeg` extension

### `tiff`

Type: `Object`

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#tiff
  quality: 100;
}
```

Config object to pass to Sharp.js for assets with `tiff` extension

### `tiff`

Type: `Object`

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#tiff
  quality: 100;
}
```

Config object to pass to Sharp.js for assets with `tiff` extension

### `gif`

Type: `Object`

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#gif
}
```

Config object to pass to Sharp.js for assets with `gif` extension

### `webp`

Type: `Object`

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#webp
  lossless: true;
}
```

Config object to pass to Sharp.js for assets with `webp` extension

### `avif`

Type: `Object`

Default:

```js
{
  // https://sharp.pixelplumbing.com/api-output#avif
  lossless: true;
}
```

Config object to pass to Sharp.js for assets with `avif` extension

### License

[MIT](./LICENSE)
