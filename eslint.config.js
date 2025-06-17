const { defineConfig, globalIgnores } = require('eslint/config');

const globals = require('globals');
const onlyWarn = require('eslint-plugin-only-warn');
const tsParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');

const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {},
    },
    extends: compat.extends('plugin:sonarjs/recommended-legacy', 'plugin:promise/recommended', 'prettier'),
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'global-require': 'off',
      'no-restricted-exports': 'off',
      'no-console': 'off',
      'func-names': 'off',
      'no-template-curly-in-string': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
    },
    plugins: {
      'only-warn': onlyWarn,
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
  },
  globalIgnores(['**/node_modules', '**/dist', '**/.idea', '**/.vscode', '**/reports', '**/tar', '!**/*.js', '!**/*.ts']),
]);
