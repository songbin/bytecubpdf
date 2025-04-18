module.exports = {
  root: true,
  env: {
    node: true,
    'vue/setup-compiler-macros': true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    project: './tsconfig.json'
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/html-indent': ['error', 2],
    'vue/script-indent': ['error', 2],
    'indent': ['error', 2],
    'semi': ['error', 'never'],
    'quotes': ['error', 'single']
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        indent: 'off'
      }
    }
  ]
}