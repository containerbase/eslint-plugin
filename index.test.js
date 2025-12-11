import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import { codeBlock } from 'common-tags';
import plugin from './index.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('codeblock rule', () => {
  it('should pass valid cases and fail invalid cases', () => {
    ruleTester.run('codeblock', plugin.rules.codeblock, {
      valid: [
        // Category 1: Basic Multiline Detection
        {
          name: 'single-line template literal should not trigger',
          code: 'const x = `single line`;',
        },
        {
          name: 'already wrapped with codeBlock should not trigger',
          code: codeBlock`
            const x = codeBlock\`
              line 1
              line 2
            \`;
          `,
        },

        // Category 2: Test Framework Exclusions
        {
          name: 'describe.each template should not trigger',
          code: codeBlock`
            describe.each\`
              row1 | row2
              1    | 2
            \`('test', (row1, row2) => {});
          `,
        },
        {
          name: 'test.each template should not trigger',
          code: codeBlock`
            test.each\`
              value
              1
            \`('test', (value) => {});
          `,
        },
        {
          name: 'it.each template should not trigger',
          code: codeBlock`
            it.each\`
              value
              1
            \`('test', (value) => {});
          `,
        },
        {
          name: 'template inside expect() should not trigger',
          code: codeBlock`
            expect(\`
              multi
              line
            \`).toBe('something');
          `,
        },
        {
          name: 'nested expect() inside function should not trigger',
          code: codeBlock`
            function test() {
              expect(\`
                line 1
                line 2
              \`).toContain('line');
            }
          `,
        },
      ],

      invalid: [
        // Category 1: Basic Multiline Detection
        {
          name: 'basic multiline template literal should trigger',
          code: codeBlock`
            const x = \`
              line 1
              line 2
            \`;
          `,
          output: codeBlock`
            const x = codeBlock\`
              line 1
              line 2
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'multiline with template expressions should trigger',
          code: codeBlock`
            const x = \`
              prefix \${variable} suffix
              another line
            \`;
          `,
          output: codeBlock`
            const x = codeBlock\`
              prefix \${variable} suffix
              another line
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'empty multiline template should trigger but cannot fix',
          code: codeBlock`
            const x = \`

            \`;
          `,
          output: null,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },

        // Category 2: codeBlock Tag Detection
        {
          name: 'different tag name should trigger',
          code: codeBlock`
            const x = otherTag\`
              line 1
              line 2
            \`;
          `,
          output: codeBlock`
            const x = otherTagcodeBlock\`
              line 1
              line 2
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'member expression tag should trigger',
          code: codeBlock`
            const x = module.codeBlock\`
              line 1
              line 2
            \`;
          `,
          output: codeBlock`
            const x = module.codeBlockcodeBlock\`
              line 1
              line 2
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },

        // Category 3: Test Framework Exclusions
        {
          name: 'regular describe() function call with template should trigger',
          code: codeBlock`
            describe(\`
              line 1
              line 2
            \`);
          `,
          output: codeBlock`
            describe(codeBlock\`
              line 1
              line 2
            \`);
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'template in other function calls should trigger',
          code: codeBlock`
            someFunction(\`
              line 1
              line 2
            \`);
          `,
          output: codeBlock`
            someFunction(codeBlock\`
              line 1
              line 2
            \`);
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },

        // Category 4: Indentation Handling
        {
          name: 'mixed indentation levels should normalize',
          code: codeBlock`
            const x = \`
                line 1
                  line 2
            \`;
          `,
          output: codeBlock`
            const x = codeBlock\`
              line 1
                line 2
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'various nesting depths should preserve parent indentation',
          code: codeBlock`
            if (true) {
              const x = \`
                line 1
                line 2
              \`;
            }
          `,
          output:
            'if (true) {\n  const x = codeBlock`\n    line 1\n    line 2\n  `;\n}',
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'empty lines in middle should be preserved',
          code: codeBlock`
            const x = \`
              line 1

              line 2
            \`;
          `,
          output: codeBlock`
            const x = codeBlock\`
              line 1

              line 2
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'no leading indentation should add proper indentation',
          code: codeBlock`
            const x = \`
            line 1
            line 2
            \`;
          `,
          output: codeBlock`
            const x = codeBlock\`
              line 1
              line 2
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'multiple nesting levels should calculate correct target indent',
          code: codeBlock`
            function outer() {
              if (condition) {
                const x = \`
                  line 1
                  line 2
                \`;
              }
            }
          `,
          output:
            'function outer() {\n  if (condition) {\n    const x = codeBlock`\n      line 1\n      line 2\n    `;\n  }\n}',
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },

        // Category 5: Complex Scenarios
        {
          name: 'multiple template expressions should be preserved',
          code: codeBlock`
            const x = \`
              prefix \${foo}
              middle \${bar}
              suffix
            \`;
          `,
          output: codeBlock`
            const x = codeBlock\`
              prefix \${foo}
              middle \${bar}
              suffix
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'escaped backticks inside should be handled',
          code: codeBlock`
            const x = \`
              code: \\\`something\\\`
              more
            \`;
          `,
          output: codeBlock`
            const x = codeBlock\`
              code: \\\`something\\\`
              more
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'nested templates (outer multiline)',
          code: codeBlock`
            const outer = \`
              line 1
              \${'inner line'}
            \`;
          `,
          output: codeBlock`
            const outer = codeBlock\`
              line 1
              \${'inner line'}
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'template with whitespace-only opening line',
          code: codeBlock`
            const x = \`
                line 1
                line 2\`;
          `,
          output: codeBlock`
            const x = codeBlock\`
              line 1
              line 2\`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'multiple templates - only unwrapped should be reported',
          code: codeBlock`
            const a = codeBlock\`
              wrapped
            \`;
            const b = \`
              unwrapped
            \`;
          `,
          output: codeBlock`
            const a = codeBlock\`
              wrapped
            \`;
            const b = codeBlock\`
              unwrapped
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },

        // Category 6: AST Traversal
        {
          name: 'template in function arguments',
          code: codeBlock`
            const x = myFunc(arg1, \`
              nested
              deep
            \`, arg2);
          `,
          output: codeBlock`
            const x = myFunc(arg1, codeBlock\`
              nested
              deep
            \`, arg2);
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'template in array literal',
          code: codeBlock`
            const arr = [1, \`
              item
              2
            \`, 3];
          `,
          output: codeBlock`
            const arr = [1, codeBlock\`
              item
              2
            \`, 3];
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
        {
          name: 'template in object property',
          code: codeBlock`
            const obj = {
              key: \`
                value 1
                value 2
              \`
            };
          `,
          output:
            'const obj = {\n  key: codeBlock`\n    value 1\n    value 2\n  `\n};',
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },

        // Additional edge case: Tab indentation
        {
          name: 'tab indentation should be handled',
          code: codeBlock`
            const x = \`
            \t\tline 1
            \t\tline 2
            \`;
          `,
          output: codeBlock`
            const x = codeBlock\`
              line 1
              line 2
            \`;
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },

        // Additional edge case: Template in deeply nested expressions
        {
          name: 'deeply nested template expression',
          code: codeBlock`
            const result = foo(bar(baz(\`
              deeply
              nested
            \`)));
          `,
          output: codeBlock`
            const result = foo(bar(baz(codeBlock\`
              deeply
              nested
            \`)));
          `,
          errors: [
            {
              message:
                'Multiline template literal should be wrapped with codeBlock tag',
            },
          ],
        },
      ],
    });
  });
});
