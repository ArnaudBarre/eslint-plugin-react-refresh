type Config = {
  plugins: { "react-refresh": any };
  rules: Record<string, any>;
};

declare const _default: {
  rules: { "only-export-components": any };
  configs: {
    recommended: Config;
    vite: Config;
  };
};

export default _default;
