/**
 * .eslintrc.js
 * rev: r.3.0.1
 *   eslint: ^3.0.1
 *   eslint-plugin-react: ^5.2.2
 *   babel-eslint: ^6.1.2
 * local-modification: no-react
 */

/* eslint-disable quote-props */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
    mocha: true,
    jquery: true,
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true,
      experimentalObjectRestSpread: true,
    },
  },
  plugins: [
  ],
  extends: ['eslint:recommended'],
  rules: {
    // Possible Errors
    'no-cond-assign': ['error', 'except-parens'],
    'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    'no-constant-condition': 'error',
    'no-control-regex': 'error',
    'no-debugger': 'error',
    'no-dupe-args': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'error',
    'no-empty-character-class': 'error',
    'no-ex-assign': 'error',
    'no-extra-boolean-cast': 'error',
    'no-extra-parens': ['off'],
    'no-extra-semi': 'error',
    'no-func-assign': 'error',
    'no-inner-declarations': ['error', 'both'],
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-negated-in-lhs': 'error',
    'no-obj-calls': 'error',
    'no-prototype-builtins': 'off',
    'no-regex-spaces': 'error',
    'no-sparse-arrays': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'use-isnan': 'error',
    'valid-jsdoc': ['warn', {
      prefer: {
        'return': 'returns',
      },
      requireReturn: true,
      requireParamDescription: false,
      requireReturnDescription: false,
    }],
    'valid-typeof': 'error',

    // Best Practices
    'accessor-pairs': 'error',
    'array-callback-return': 'error',
    'block-scoped-var': 'error',
    'complexity': 'warn',
    'consistent-return': 'warn',
    'curly': ['error', 'all'],
    'default-case': 'error',
    'dot-location': ['error', 'property'],
    'dot-notation': ['error', { allowKeywords: true }],
    'eqeqeq': 'error',
    'guard-for-in': 'off',
    'no-alert': 'error',
    'no-caller': 'error',
    'no-case-declarations': 'error',
    'no-div-regex': 'error',
    'no-else-return': 'off',
    'no-empty-function': 'warn',
    'no-empty-pattern': 'error',
    'no-eq-null': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-fallthrough': 'error',
    'no-floating-decimal': 'error',
    'no-implicit-coercion': 'off',
    'no-implicit-globals': 'off',
    'no-implied-eval': 'error',
    'no-invalid-this': 'error',
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-loop-func': 'error',
    'no-magic-numbers': 'off',
    'no-multi-spaces': ['error', { exceptions: { Property: false } }],
    'no-multi-str': 'error',
    'no-native-reassign': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-octal': 'error',
    'no-octal-escape': 'error',
    'no-param-reassign': 'warn',
    'no-proto': 'error',
    'no-redeclare': 'error',
    'no-return-assign': 'error',
    'no-script-url': 'error',
    'no-self-assign': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-unused-labels': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-escape': 'error',
    'no-void': 'error',
    'no-warning-comments': 'off',
    'no-with': 'error',
    'radix': ['error', 'as-needed'],
    'vars-on-top': 'off',
    'wrap-iife': ['error', 'outside'],
    'yoda': ['error', 'never'],

    // Strict Mode
    'strict': ['off', 'global'],

    // Variables
    'init-declarations': 'off',
    'no-catch-shadow': 'off',
    'no-delete-var': 'error',
    'no-label-var': 'error',
    'no-restricted-globals': 'off',
    'no-shadow': ['warn', {
      allow: ['cb', 'clbk', 'callback', 'done', 'next', 'resolve', 'reject'],
    }],
    'no-shadow-restricted-names': 'error',
    'no-undef': 'error',
    'no-undef-init': 'error',
    'no-undefined': 'error',
    'no-unused-vars': ['warn', { vars: 'all', args: 'after-used' }],
    'no-use-before-define': ['error', { functions: false, classes: true }],

    // Node.js and CommonJS
    'callback-return': ['error', ['cb', 'clbk', 'callback', 'done', 'next']],
    'global-require': 'error',
    'handle-callback-err': ['warn', '^(err|error)$'],
    'no-mixed-requires': ['error', {
      grouping: true,
      allowCall: true,
    }],
    'no-new-require': 'error',
    'no-path-concat': 'error',
    'no-process-env': 'off',
    'no-process-exit': 'error',
    'no-restricted-modules': 'off',
    'no-sync': 'warn',

    // Stylistic Issues
    'array-bracket-spacing': ['error', 'never'],
    'block-spacing': ['error', 'always'],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'camelcase': ['error', { properties: 'never' }],
    'comma-dangle': ['warn', 'always-multiline'],
    'comma-spacing': ['error', { before: false, after: true }],
    'comma-style': ['error', 'last'],
    'computed-property-spacing': ['error', 'never'],
    'consistent-this': ['error', 'self', 'context'],
    'eol-last': 'error',
    'func-names': 'warn',
    'func-style': 'off',
    'id-blacklist': 'off',
    'id-length': ['warn', {
      min: 2,
      exceptions: ['c', 'e', 'i', 'j', 'k', 'l', 'n', 'v', 'x', 'y', '$', '_'],
    }],
    'id-match': ['off'],
    'indent': ['error', 2, {
      SwitchCase: 1,
      VariableDeclarator: { 'var': 2, 'let': 2, 'const': 3 },
    }],
    'jsx-quotes': ['error', 'prefer-double'],
    'key-spacing': ['error', {
      beforeColon: false,
      afterColon: true,
      mode: 'strict',
    }],
    'keyword-spacing': ['error', {
      before: true,
      after: true,
    }],
    'linebreak-style': ['error', 'unix'],
    'lines-around-comment': ['error', { beforeBlockComment: true }],
    'max-depth': ['warn', 4],
    'max-len': ['error', {
      code: 80,
      tabWidth: 2,
      ignoreComments: true,
      ignoreTrailingComments: true,
      ignoreUrls: true,
    }],
    'max-lines': 'off',
    'max-nested-callbacks': ['error', 4],
    'max-params': ['warn', 6],
    'max-statements': ['warn', 30],
    'max-statements-per-line': ['error', { max: 1 }],
    'new-cap': 'error',
    'new-parens': 'error',
    'newline-after-var': 'off',
    'newline-before-return': 'off',
    'newline-per-chained-call': ['off', { ignoreChainWithDepth: 3 }],
    'no-array-constructor': 'error',
    'no-bitwise': 'error',
    'no-continue': 'error',
    'no-inline-comments': 'off',
    'no-lonely-if': 'error',
    'no-mixed-operators': 'warn',
    'no-mixed-spaces-and-tabs': 'error',
    'no-multiple-empty-lines': ['error', { max: 2, maxBOF: 0, maxEOF: 0 }],
    'no-negated-condition': 'error',
    'no-nested-ternary': 'warn',
    'no-new-object': 'error',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-restricted-syntax': ['error', 'WithStatement'],
    'no-spaced-func': 'error',
    'no-ternary': 'off',
    'no-trailing-spaces': 'error',
    'no-underscore-dangle': 'off',
    'no-unneeded-ternary': ['error', { defaultAssignment: false }],
    'no-whitespace-before-property': 'error',
    'object-curly-newline': ['off'],
    'object-curly-spacing': ['error', 'always'],
    'object-property-newline': ['error', {
      'allowMultiplePropertiesPerLine': true,
    }],
    'one-var': ['error', 'never'],
    'one-var-declaration-per-line': ['error', 'always'],
    'operator-assignment': ['warn', 'always'],
    'operator-linebreak': ['error', 'before'],
    'padded-blocks': ['error', {
      blocks: 'never',
      switches: 'never',
      classes: 'never',
    }],
    'quote-props': ['warn', 'as-needed', { keywords: true, numbers: true }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'require-jsdoc': ['off', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
      },
    }],
    'semi': ['error', 'always'],
    'semi-spacing': ['error', { before: false, after: true }],
    'sort-vars': 'off',
    'space-before-blocks': ['error', 'always'],
    'space-before-function-paren': ['error', 'never'],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'space-unary-ops': ['error', { words: true, nonwords: false }],
    'spaced-comment': ['error', 'always', {
      exceptions: ['-'],
      markers: [
        'eslint',
        'eslint-disable',
        'eslint-enable',
        'eslint-env',
        'global',
      ],
    }],
    'unicode-bom': ['error', 'never'],
    'wrap-regex': 'warn',

    // ECMAScript 6
    'arrow-body-style': ['off', 'as-needed'],
    'arrow-parens': ['error', 'always'],
    'arrow-spacing': ['error', { before: true, after: true }],
    'constructor-super': 'error',
    'generator-star-spacing': ['error', 'after'],
    'no-class-assign': 'error',
    'no-confusing-arrow': ['error', { allowParens: true }],
    'no-const-assign': 'error',
    'no-dupe-class-members': 'error',
    'no-duplicate-imports': 'error',
    'no-new-symbol': 'error',
    'no-restricted-imports': ['off'],
    'no-this-before-super': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    'no-var': 'error',
    'object-shorthand': ['error', 'always'],
    'prefer-arrow-callback': 'warn',
    'prefer-const': 'warn',
    'prefer-reflect': 'off',
    'prefer-rest-params': 'warn',
    'prefer-spread': 'warn',
    'prefer-template': 'off',
    'require-yield': 'error',
    'rest-spread-spacing': ['error', 'never'],
    'sort-imports': 'off',
    'template-curly-spacing': ['error', 'never'],
    'yield-star-spacing': ['error', 'after'],
  },
};
