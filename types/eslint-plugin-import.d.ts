declare module 'eslint-plugin-import' {
  import type eslint from 'eslint';

  interface Default {
    flatConfigs: {
      errors: eslint.Linter.Config;
      warnings: eslint.Linter.Config;
      recommended: eslint.Linter.Config;
      typescript: eslint.Linter.Config;
    };
  }

  const _default: Default;

  export = _default;
}
