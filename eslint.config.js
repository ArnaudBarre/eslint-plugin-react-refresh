import baseConfig from "@arnaud-barre/eslint-config";
import { defineConfig } from "eslint/config";

export default defineConfig(baseConfig, {
  rules: {
    "@arnaud-barre/no-default-export": "off",
  },
});
