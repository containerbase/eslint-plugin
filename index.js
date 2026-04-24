import pkg from './package.json' with { type: 'json' };
import testRootDescribe from './rules/test-root-describe.js';

/** @type {Record<string, import('eslint').Rule.RuleModule>} */
const rules = {
  'test-root-describe': testRootDescribe,
};

/** @type {Record<string, import('eslint').Linter.Config> } */
const configs = {
  all: {
    plugins: {
      get '@containerbase'() {
        return plugin;
      },
    },
    rules: {
      '@containerbase/test-root-describe': 'error',
    },
  },
};

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  rules,
  configs,
};

export default plugin;
