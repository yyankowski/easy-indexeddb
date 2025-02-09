import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config({
  ignores: ['dist', 'coverage', 'node_modules', '*.config.js', '.idea'],
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
  ],
  languageOptions: {
    parserOptions: {
      project: true, // Enable type-aware linting
      tsconfigRootDir: import.meta.dirname,
    },
  },
  ...prettierConfig, // Disables ESLint rules that conflict with Prettier
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/strict-boolean-expressions': 'error',
  },
});
