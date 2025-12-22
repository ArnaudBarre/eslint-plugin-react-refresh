type Rules = { "only-export-components": any };

export type OnlyExportComponentsOptions = {
  customHOCs?: string[];
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
  rules: Rules;
  configs: {
    recommended: Config;
    vite: Config;
    next: Config;
  };
};

export default _default;
