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

export const reactRefresh: {
  plugin: {
    rules: Rules;
  };
  configs: {
    recommended: Config;
    vite: Config;
    next: Config;
  };
};
