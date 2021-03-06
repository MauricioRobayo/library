module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ['airbnb-base'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 8,
  },
  rules: {
    'no-shadow': 0,
    'no-param-reassign': 0,
    'eol-last': 0,
  },
};
