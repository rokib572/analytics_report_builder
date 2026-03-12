import tseslint from "@typescript-eslint/eslint-plugin"
import tsparser from "@typescript-eslint/parser"
// @ts-expect-error -- no type declarations available
import prettier from "eslint-config-prettier"

declare global {
  interface ImportMeta {
    dirname: string
  }
}

export default [
  {
    ignores: ["**/dist/**", "**/*.config.ts"],
  },
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}", "domain/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: [
          "./apps/ui/tsconfig.json",
          "./apps/api/tsconfig.json",
          "./packages/*/tsconfig.json",
          "./domain/*/tsconfig.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: "error",
      "no-duplicate-imports": "error",
    },
  },
  prettier,
]
