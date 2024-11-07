import process from 'node:process';
import pkg from './package.json' with { type: 'json' };

/** @type {Record<string, import('eslint').Rule.RuleModule>} */
const rules = {
  'test-root-describe': {
    meta: {
      fixable: 'code',
    },
    create(context) {
      const absoluteFileName = context.filename;
      if (!absoluteFileName.endsWith('.spec.ts')) {
        return {};
      }
      const relativeFileName = absoluteFileName
        .replace(process.cwd(), '')
        .replace(/\\/g, '/')
        .replace(/^(?:\/(?:lib|src|test))?\//, '');
      const testName = relativeFileName.replace(/\.spec\.ts$/, '');
      return {
        CallExpression(node) {
          const { callee } = node;
          if (
            callee.type === 'Identifier' &&
            callee.name === 'describe' &&
            node.parent.parent.type === 'Program'
          ) {
            const [descr] = node.arguments;

            if (!descr) {
              context.report({
                node,
                message: `Test root describe must have arguments`,
              });
              return;
            }

            const isOkay =
              descr.type === 'Literal' &&
              typeof descr.value === 'string' &&
              testName === descr.value;
            if (!isOkay) {
              context.report({
                node: descr,
                message: `Test must be described by this string: '${testName}'`,
                fix(fixer) {
                  return fixer.replaceText(descr, `'${testName}'`);
                },
              });
            }
          }
        },
      };
    },
  },
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
