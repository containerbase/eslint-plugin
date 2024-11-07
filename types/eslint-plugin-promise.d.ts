declare module 'eslint-plugin-promise' {
  import type eslint from 'eslint';

  type Plugin = eslint.ESLint.Plugin & {
    configs: {
      'flat/recommended': eslint.Linter.Config;
    };
  };

  const plugin: Plugin;

  export = plugin;
}
