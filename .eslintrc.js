module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    jest: true, // Add if you use Jest
  },
  extends: [
    'airbnb-base', // Provides a good baseline
    'plugin:node/recommended',
    'plugin:prettier/recommended', // Displays Prettier errors as ESLint errors. Make sure this is last.
  ],
  parserOptions: {
    ecmaVersion: 'latest', // Node 20 supports modern ECMAScript
  },
  rules: {
    'prettier/prettier': ['error', { "endOfLine": "auto" }], // Use Prettier rules, endOfLine auto for cross-platform compatibility
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'consistent-return': 'off',
    'import/prefer-default-export': 'off',
    'node/no-unpublished-require': 'off', // Often needed for dev scripts or tools
    // Add or override more rules as your team sees fit
    // e.g., 'node/no-unsupported-features/es-syntax': ['error', { version: '>=20.19.0' }]
  },
};
