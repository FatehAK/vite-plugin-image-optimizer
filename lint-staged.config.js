const prettierCmd = `prettier --log-level warn --cache --cache-strategy content --cache-location ./node_modules/.cache/.prettiercache --write`;
const eslintCmd = `eslint --max-warnings=0 --format=pretty --cache --cache-strategy content --cache-location ./node_modules/.cache/.eslintcache --fix`;

/** @type {import('lint-staged').Configuration} */
export default {
  '**/*.{js,ts}': [eslintCmd, prettierCmd],
  '**/*.{md,json,yaml,yml}': [prettierCmd],
};
