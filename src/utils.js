import fs from 'fs';
import { join } from 'pathe';

function deepClone(src) {
  if (typeof src !== 'object' || src === null) return src;
  const target = Array.isArray(src) ? [] : {};
  for (const key in src) {
    const value = src[key];
    target[key] = deepClone(value);
  }
  return target;
}

export function merge(src, target) {
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
