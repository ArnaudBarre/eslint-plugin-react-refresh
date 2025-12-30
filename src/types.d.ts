type Rules = { "only-export-components": any };

export type OnlyExportComponentsOptions = {
  extraHOCs?: string[];
  allowExportNames?: string[];
  allowConstantExport?: boolean;
  checkJS?: boolean;
};

type Config = (options?: OnlyExportComponentsOptions) => {
  name: string;
  plugins: { "react-refresh": { rules: Rules } };
  rules: Rules;
};

declare const _default: {
  plugin: {
    rules: Rules;
  };
  configs: {
    recommended: Config;
    vite: Config;
    next: Config;
  };
};

export default _default;
