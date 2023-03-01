module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: ['semistandard', 'plugin:sonarjs/recommended', 'plugin:promise/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'sonarjs/no-duplicate-string': 'off',
    'sonarjs/no-nested-template-literals': 'off',
    'sonarjs/cognitive-complexity': 'off',
    'global-require': 'off',
    'no-restricted-exports': 'off',
    'no-console': 'off',
    'func-names': 'off',
    'no-template-curly-in-string': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  plugins: ['only-warn'],
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
    },
  ],
};
