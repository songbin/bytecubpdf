module.exports = {
  root: true,
  env: {
    node: true,
    'vue/setup-compiler-macros': true
  },
  extends: [
   
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    project: './tsconfig.json'
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/html-indent': 'off',
    'vue/script-indent': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/attributes-order': 'off',
    'vue/no-multi-spaces': 'off',
    'vue/html-quotes': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'indent': 'off',
    'semi': 'off',
    'quotes': 'off',
    'no-empty': 'off'
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