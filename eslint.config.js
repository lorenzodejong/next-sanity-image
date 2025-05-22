import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";
import * as reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      ...pluginReact.configs.flat.recommended?.settings ?? {},
      react: {
        ...pluginReact.configs.flat.recommended?.settings?.react ?? {},
        version: "detect",
      }
    }
  },
  {
    plugins: { "react-hooks": reactHooks },
  },
  eslintConfigPrettier,
  { ignores: ["dist/**"]}
]);
