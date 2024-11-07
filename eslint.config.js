/* eslint-disable import/no-named-as-default-member */
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPromise from 'eslint-plugin-promise';
import tseslint from 'typescript-eslint';

export default tseslint.config(
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
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginImport.flatConfigs.errors,
  eslintPluginImport.flatConfigs.warnings,
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginImport.flatConfigs.typescript,
  eslintPluginPromise.configs['flat/recommended'],
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,js,cjs,mjs}'],
    rules: {},
  },
);
