const nextConfig = require("eslint-config-next/core-web-vitals");

module.exports = [
  ...nextConfig,
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "playwright-report-deploy/**",
      "test-results/**",
      "test-results-deploy/**",
      "out/**",
      "build/**",
      // Isolierte Git-Worktrees anderer Sessions (.claude/worktrees/*) enthalten
      // eigene, teils gebaute Kopien des Repos und dürfen vom Haupt-Lint-Lauf
      // nicht mitgeprüft werden.
      ".claude/worktrees/**",
    ],
  },
];
