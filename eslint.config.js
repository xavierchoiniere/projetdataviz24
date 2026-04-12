/**
 * Configuration ESLint minimale pour un projet ES modules exécuté dans le navigateur.
 */
export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        Blob: 'readonly',
        CustomEvent: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        window: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  }
];
