const prettierCmd = `prettier --loglevel warn --cache --cache-strategy content --cache-location ./node_modules/.cache/.prettiercache --write`;
const eslintCmd = `eslint --max-warnings=0 --cache --cache-strategy content --cache-location ./node_modules/.cache/.eslintcache --fix`;

module.exports = {
  '**/*.{js,ts}': [eslintCmd, prettierCmd],
  '**/*.{md,json,yaml,yml}': [prettierCmd],
};
