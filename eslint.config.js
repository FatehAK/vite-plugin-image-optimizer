import { defineConfig, globalIgnores } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';
import onlyWarn from 'eslint-plugin-only-warn';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';

const __dirname = import.meta.dirname;

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig([
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
