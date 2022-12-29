module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: ['semistandard', 'plugin:import/recommended', 'plugin:sonarjs/recommended', 'plugin:promise/recommended', 'prettier'],
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
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'sort-imports': 'off', // turned off in favour of import/order rule
    'import/order': [
      'error',
      {
        'newlines-between': 'ignore',
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      },
    ],
  },
  plugins: ['only-warn', 'import', 'sonarjs', 'promise'],
};
