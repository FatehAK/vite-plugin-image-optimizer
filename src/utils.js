import fs from 'fs-extra';
import { join } from 'pathe';

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
