module.exports = {
  extends: [
    "next",
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier" // 👈 must be last to override conflicting rules
  ],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
};
