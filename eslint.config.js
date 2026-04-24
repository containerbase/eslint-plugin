import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import * as importX from 'eslint-plugin-import-x';
import eslintPluginPromise from 'eslint-plugin-promise';
import globals from 'globals';
import { configs as tseslint } from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

const jsFiles = { files: ['**/*.{js,cjs,mjs,mts,ts}'] };

export default defineConfig(
  {
    ignores: [
      'dist/',
      'tmp/',
      'bin/',
      'coverage/',
      'html/',
      '**/node_modules/',
      '.pnpm-store',
    ],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  js.configs.recommended,
  ...tseslint.recommendedTypeChecked,
  ...tseslint.stylisticTypeChecked,
  eslintPluginPromise.configs['flat/recommended'],
  {
    ...jsFiles,
    extends: [importX.flatConfigs.recommended, importX.flatConfigs.typescript],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: 'tsconfig.lint.json' }),
      ],
    },
  },
  eslintConfigPrettier,
  {
    ...jsFiles,
    rules: {},
  },
);
