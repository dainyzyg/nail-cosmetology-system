// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential',
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    'standard'
  ],
  // required to lint *.vue files
  plugins: ['vue'],
  // add your custom rules here
  rules: {
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    semi: ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-console': 'off',
    'space-before-function-paren': 'off',
    'arrow-parens': 'off',
    'no-restricted-syntax': 'off',
    'no-unused-vars': ['error', { args: 'none' }],
    'no-mixed-operators': 'off',
    'no-bitwise': 'off',
    'arrow-body-style': 'off',
    'dot-notation': 'off',
    'no-param-reassign': 'off',
    'standard/no-callback-literal': 'off',
    'standard/computed-property-even-spacing': 'off',
    eqeqeq: 'off'
  }
}
