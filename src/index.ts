import { onlyExportComponents } from "./only-export-components.ts";

export const configs = {
  recommended: {
    plugins: ["react-refresh"],
    rules: {
      "react-refresh/only-export-components": "warn",
    },
  },
};

export const rules = {
  "only-export-components": onlyExportComponents,
};
