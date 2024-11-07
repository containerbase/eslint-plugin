import eslint from 'eslint';

const plugin: eslint.ESLint.Plugin & {
  configs: {
    all: eslint.Linter.Config;
  };
};

export default plugin;
