module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'semistandard',
    'plugin:import/recommended',
    'plugin:sonarjs/recommended',
    'plugin:promise/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'sonarjs/no-duplicate-string': 'off',
    'sonarjs/no-nested-template-literals': 'off',
    'sonarjs/cognitive-complexity': 'off',
  },
  plugins: ['only-warn', 'import', 'sonarjs', 'promise'],
};