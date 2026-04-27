export default {
  plugins: [
    '@stylistic/stylelint-plugin',
  ],
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-recess-order',
    '@stylistic/stylelint-config',
  ],
  overrides:[
    {
      "files": ["*.html", "**/*.html"],
      "customSyntax": "postcss-html"
    }
  ],
  rules: {
    "selector-class-pattern": null
  },
};
