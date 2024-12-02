import baseConfig from "@arnaud-barre/eslint-config";

export default [
  ...baseConfig,
  {
    rules: {
      "@arnaud-barre/no-default-export": "off",
    },
  },
];
