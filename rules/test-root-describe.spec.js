import { join } from 'node:path';
import { RuleTester } from 'eslint';
import { describe, test } from 'vitest';
import rule from './test-root-describe.js';

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const ruleTester = new RuleTester();

// the rule derives the expected name from the file path relative to the cwd
const filename = join(process.cwd(), 'src/cli/utils/file.spec.ts');

ruleTester.run('test-root-describe', rule, {
  valid: [
    { code: `describe('cli/utils/file', () => {});`, filename },
    // nested describes may use any name
    {
      code: `describe('cli/utils/file', () => { describe('other', () => {}); });`,
      filename,
    },
    // only spec files are checked
    {
      code: `describe('other', () => {});`,
      filename: join(process.cwd(), 'src/cli/utils/file.ts'),
    },
    {
      code: `describe('tools/file', () => {});`,
      filename: join(process.cwd(), 'tools/file.spec.ts'),
    },
  ],
  invalid: [
    {
      code: `describe('other', () => {});`,
      filename,
      output: `describe('cli/utils/file', () => {});`,
      errors: [{ message: "Test must be described by this string: 'cli/utils/file'" }],
    },
    {
      code: 'describe(`cli/utils/file`, () => {});',
      filename,
      output: `describe('cli/utils/file', () => {});`,
      errors: [{ message: "Test must be described by this string: 'cli/utils/file'" }],
    },
    {
      code: `describe();`,
      filename,
      output: null,
      errors: [{ message: 'Test root describe must have arguments' }],
    },
  ],
});
