declare module 'eslint-plugin-import' {
  import type eslint from 'eslint';

  type Plugin = eslint.ESLint.Plugin & {
    flatConfigs: {
      errors: eslint.Linter.Config;
      recommended: eslint.Linter.Config;
      typescript: eslint.Linter.Config;
      warnings: eslint.Linter.Config;
    };
  };

  const plugin: Plugin;

  export = plugin;
}
