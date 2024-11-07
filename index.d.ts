import './types/eslint-plugin-import.d.ts';
import './types/eslint-plugin-promise.d.ts';

import eslint from 'eslint';

const plugin: eslint.ESLint.Plugin & {
  configs: {
    all: eslint.Linter.Config;
  };
};

export default plugin;
