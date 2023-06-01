import type { ResolvedConfig } from 'vite';
import fs from 'fs';
import { join, basename } from 'pathe';
import ansi from 'ansi-colors';

interface Sizes {
  size: number;
  oldSize: number;
  ratio: number;
  skipWrite: boolean;
}

/* type utils */
function isRegex(src) {
  return Object.prototype.toString.call(src) === '[object RegExp]';
}

function isString(src) {
  return Object.prototype.toString.call(src) === '[object String]';
}

function isArray(src) {
  return Array.isArray(src);
}

export function merge(src, target) {
  const deepClone = src => {
    if (typeof src !== 'object' || isRegex(src) || src === null) return src;
    const target = Array.isArray(src) ? [] : {};
    for (const key in src) {
      const value = src[key];
      target[key] = deepClone(value);
    }
    return target;
  };

  const clone = deepClone(src);
  for (const key in target) {
    if (clone[key] === undefined) {
      clone[key] = target[key];
    }
  }
  return clone;
}

export function readAllFiles(root) {
  let resultArr = [];
  try {
    if (fs.existsSync(root)) {
      const stat = fs.lstatSync(root);
      if (stat.isDirectory()) {
        const files = fs.readdirSync(root);
        files.forEach(function (file) {
          const t = readAllFiles(join(root, '/', file));
          resultArr = resultArr.concat(t);
        });
      } else {
        resultArr.push(root);
      }
    }
  } catch (error) {
    console.log(error);
  }

  return resultArr;
}

export function areFilesMatching(fileName: string, matcher): boolean {
  if (isString(matcher)) return fileName === matcher;
  if (isRegex(matcher)) return matcher.test(fileName);
  if (isArray(matcher)) return matcher.includes(fileName);
  return false;
}

/* loggers */
function decideStyle(text: string, enableColors: boolean) {
  return enableColors ? text : ansi.unstyle(text);
}

export function logErrors(rootConfig: ResolvedConfig, errorsMap: Map<string, string>, ansiColors: boolean) {
  rootConfig.logger.info(decideStyle(`\n🚨 ${ansi.red('[vite-plugin-image-optimizer]')} - errors during optimization: `, ansiColors));

  const keyLengths: number[] = Array.from(errorsMap.keys(), (name: string) => name.length);
  const maxKeyLength: number = Math.max(...keyLengths);

  errorsMap.forEach((message: string, name: string) => {
    rootConfig.logger.error(
      decideStyle(
        `${ansi.dim(basename(rootConfig.build.outDir))}/${ansi.blueBright(name)}${' '.repeat(2 + maxKeyLength - name.length)} ${ansi.red(
          message
        )}`,
        ansiColors
      )
    );
  });
  rootConfig.logger.info('\n');
}

export function logOptimizationStats(rootConfig: ResolvedConfig, sizesMap: Map<string, Sizes>, ansiColors: boolean) {
  rootConfig.logger.info(decideStyle(`\n✨ ${ansi.cyan('[vite-plugin-image-optimizer]')} - optimized images successfully: `, ansiColors));

  const keyLengths: number[] = Array.from(sizesMap.keys(), (name: string) => name.length);
  const valueLengths: number[] = Array.from(sizesMap.values(), (value: any) => `${Math.floor(100 * value.ratio)}`.length);

  const maxKeyLength: number = Math.max(...keyLengths);
  const valueKeyLength: number = Math.max(...valueLengths);

  let totalOriginalSize: number = 0;
  let totalSavedSize: number = 0;
  sizesMap.forEach((value, name) => {
    const { size, oldSize, ratio, skipWrite } = value;

    const percentChange: string = ratio > 0 ? ansi.red(`+${ratio}%`) : ratio <= 0 ? ansi.green(`${ratio}%`) : '';

    const sizeText: string = skipWrite
      ? `${ansi.yellow.bold('skipped')} ${ansi.dim(`original: ${oldSize.toFixed(2)} kB <= optimized: ${size.toFixed(2)} kB`)}`
      : ansi.dim(`${oldSize.toFixed(2)} kB ⭢  ${size.toFixed(2)} kB`);

    rootConfig.logger.info(
      decideStyle(
        ansi.dim(basename(rootConfig.build.outDir)) +
          '/' +
          ansi.blueBright(name) +
          ' '.repeat(2 + maxKeyLength - name.length) +
          ansi.gray(`${percentChange} ${' '.repeat(valueKeyLength - `${ratio}`.length)}`) +
          ' ' +
          sizeText,
        ansiColors
      )
    );

    if (!skipWrite) {
      totalOriginalSize += oldSize;
      totalSavedSize += oldSize - size;
    }
  });

  if (totalSavedSize > 0) {
    const savedText = `${totalSavedSize.toFixed(2)}kB`;
    const originalText = `${totalOriginalSize.toFixed(2)}kB`;
    const savingsPercent = `${Math.round((totalSavedSize / totalOriginalSize) * 100)}%`;
    rootConfig.logger.info(
      decideStyle(`\n💰 total savings = ${ansi.green(savedText)}/${ansi.green(originalText)} ≈ ${ansi.green(savingsPercent)}`, ansiColors)
    );
  }

  rootConfig.logger.info('\n');
}
