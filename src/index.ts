import { onlyExportComponents } from "./only-export-components.ts";

export const rules = {
  "only-export-components": onlyExportComponents,
};

const plugin = { rules };

export const configs = {
  recommended: {
    name: "react-refresh/recommended",
    plugins: { "react-refresh": plugin },
    rules: { "react-refresh/only-export-components": "error" },
  },
  vite: {
    name: "react-refresh/vite",
    plugins: { "react-refresh": plugin },
    rules: {
      "react-refresh/only-export-components": [
        "error",
        { allowConstantExport: true },
      ],
    },
  },
};

// Probably not needed, but keep for backwards compatibility
export default { rules, configs };
