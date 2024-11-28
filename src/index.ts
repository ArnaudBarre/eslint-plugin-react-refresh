import { onlyExportComponents } from "./only-export-components.ts";

const plugin = {
  rules: {
    "only-export-components": onlyExportComponents,
  },
};

export default {
  rules: plugin.rules,
  configs: {
    recommended: {
      plugins: { "react-refresh": plugin },
      rules: { "react-refresh/only-export-components": "error" },
    },
    vite: {
      plugins: { "react-refresh": plugin },
      rules: {
        "react-refresh/only-export-components": [
          "error",
          { allowConstantExport: true },
        ],
      },
    },
  },
};
