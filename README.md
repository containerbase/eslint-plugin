# @containerbase/eslint-plugin

[ESLint](https://eslint.org/) plugin with the containerbase lint rules.

## Usage

Enable all rules with the `all` config in your `eslint.config.js`:

```js
import containerbase from '@containerbase/eslint-plugin';

export default [containerbase.configs.all];
```

Or pick single rules:

```js
import containerbase from '@containerbase/eslint-plugin';

export default [
  {
    plugins: { '@containerbase': containerbase },
    rules: {
      '@containerbase/enforce-ts-extension': 'error',
      '@containerbase/test-root-describe': 'error',
    },
  },
];
```

## Rules

- `enforce-ts-extension`: in TypeScript files, local imports and exports (relative or `~` aliased) use `.ts` instead of `.js`, and local paths in `vi.mock` and friends have a file extension. Fixable.
- `test-root-describe`: the root `describe` of a spec file is named after its path, without `src/`, `lib/` or `test/` and the `.spec.ts` suffix. Fixable.

## Development

Node.js, pnpm and jactionlint are pinned in [`mise.toml`](./mise.toml), so [`mise`](https://mise.jdx.dev) installs them and the dependencies with `mise install`.
Without mise, install the dependencies with `pnpm install`.

```bash
mise install
pnpm lint
pnpm test
jactionlint
```

- `pnpm lint-fix` fixes the formatting and the fixable lint findings.
- `jactionlint` checks the GitHub workflows.
