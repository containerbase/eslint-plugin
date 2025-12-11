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
  codeblock: {
    meta: {
      fixable: 'code',
      docs: {
        description: 'Enforce codeBlock tags for multiline template literals',
        recommended: true,
      },
    },
    create(context) {
      const sourceCode = context.sourceCode;

      /**
       * @typedef {object} NodeWithParent
       * @property {string} type
       * @property {NodeWithParent | undefined} parent
       * @property {unknown} [tag]
       * @property {unknown} [property]
       * @property {unknown} [object]
       * @property {unknown} [callee]
       * @property {string} [name]
       */

      /**
       * @param {unknown} value
       * @returns {value is NodeWithParent}
       */
      function isNodeWithParent(value) {
        return (
          typeof value === 'object' &&
          value !== null &&
          'type' in value &&
          typeof value.type === 'string'
        );
      }

      // Helper: Check if node is inside excluded test framework call
      /**
       * @param {import('estree').TemplateLiteral} node
       * @returns {boolean}
       */
      function isInExcludedContext(node) {
        const nodeWithParent = /** @type {unknown} */ (node);
        if (
          !nodeWithParent ||
          typeof nodeWithParent !== 'object' ||
          !('parent' in nodeWithParent)
        ) {
          return false;
        }
        let parent = /** @type {unknown} */ (nodeWithParent.parent);
        while (isNodeWithParent(parent)) {
          const currentParent = /** @type {NodeWithParent} */ (parent);
          // Check for tagged templates: describe.each`...`, test.each`...`, it.each`...`
          if (
            currentParent.type === 'TaggedTemplateExpression' &&
            isNodeWithParent(currentParent.tag)
          ) {
            const tag = /** @type {NodeWithParent} */ (currentParent.tag);
            if (
              tag.type === 'MemberExpression' &&
              isNodeWithParent(tag.property) &&
              isNodeWithParent(tag.object)
            ) {
              const property = /** @type {NodeWithParent} */ (tag.property);
              const object = /** @type {NodeWithParent} */ (tag.object);
              if (
                property.type === 'Identifier' &&
                property.name === 'each' &&
                object.type === 'Identifier' &&
                typeof object.name === 'string' &&
                ['describe', 'test', 'it'].includes(object.name)
              ) {
                return true;
              }
            }
          }

          // Check for expect() call expression
          if (
            currentParent.type === 'CallExpression' &&
            isNodeWithParent(currentParent.callee)
          ) {
            const callee = /** @type {NodeWithParent} */ (currentParent.callee);
            if (callee.type === 'Identifier' && callee.name === 'expect') {
              return true;
            }
          }

          parent = currentParent.parent;
        }
        return false;
      }

      // Helper: Check if already wrapped with codeBlock
      /**
       * @param {import('estree').TemplateLiteral} node
       * @returns {boolean}
       */
      function isCodeBlockTagged(node) {
        const nodeWithParent = /** @type {unknown} */ (node);
        if (
          !nodeWithParent ||
          typeof nodeWithParent !== 'object' ||
          !('parent' in nodeWithParent)
        ) {
          return false;
        }
        const parent = /** @type {unknown} */ (nodeWithParent.parent);
        if (!isNodeWithParent(parent)) {
          return false;
        }
        const currentParent = /** @type {NodeWithParent} */ (parent);
        if (
          currentParent.type === 'TaggedTemplateExpression' &&
          isNodeWithParent(currentParent.tag)
        ) {
          const tag = /** @type {NodeWithParent} */ (currentParent.tag);
          return tag.type === 'Identifier' && tag.name === 'codeBlock';
        }
        return false;
      }

      // Helper: Calculate indentation and create fixed text
      /**
       * @param {import('estree').TemplateLiteral} node
       * @returns {string | null}
       */
      function createFixedText(node) {
        const nodeAsUnknown = /** @type {unknown} */ (node);
        const text = sourceCode.getText(
          /** @type {import('estree').Node} */ (nodeAsUnknown),
        );
        const lines = text.slice(1, -1).split('\n'); // Remove backticks

        // Find minimum indentation
        const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
        if (nonEmptyLines.length === 0) return null; // Skip empty templates

        const minIndent = Math.min(
          ...nonEmptyLines.map((line) => {
            const match = /^(\s*)/.exec(line);
            return match ? match[1].length : 0;
          }),
        );

        // Get base indentation from the line where codeBlock will be
        const nodeWithLoc =
          /** @type {{ loc?: { start: { line: number } } }} */ (nodeAsUnknown);
        if (!nodeWithLoc.loc) return null;
        const nodeStartLine = sourceCode.lines[nodeWithLoc.loc.start.line - 1];
        const baseIndentMatch = /^(\s*)/.exec(nodeStartLine);
        const baseIndent = baseIndentMatch ? baseIndentMatch[1] : '';
        const targetIndent = baseIndent + '  '; // One level deeper

        // Re-indent lines
        const reindentedLines = lines.map((line) => {
          if (line.trim().length === 0) return ''; // Empty lines become empty strings
          const stripped = line.slice(minIndent);
          return targetIndent + stripped;
        });

        return `codeBlock\`${reindentedLines.join('\n')}${baseIndent}\``;
      }

      return {
        TemplateLiteral(node) {
          // Check if multiline
          if (node.loc.start.line === node.loc.end.line) {
            return; // Single line, skip
          }

          // Check if already tagged with codeBlock
          if (isCodeBlockTagged(node)) {
            return; // Already wrapped, skip
          }

          // Check if in excluded test framework context
          if (isInExcludedContext(node)) {
            return; // Excluded context, skip
          }

          // Report violation
          context.report({
            node,
            message:
              'Multiline template literal should be wrapped with codeBlock tag',
            fix(fixer) {
              const fixedText = createFixedText(node);
              if (!fixedText) return null; // Cannot fix (empty template)

              return fixer.replaceText(node, fixedText);
            },
          });
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
      '@containerbase/codeblock': 'error',
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
