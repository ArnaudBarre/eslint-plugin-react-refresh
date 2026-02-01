import { onlyExportComponents } from "./only-export-components.ts";
import type { OnlyExportComponentsOptions } from "./types.d.ts";

const rules = {
  "only-export-components": onlyExportComponents,
};
const plugin = { rules };

const buildConfig =
  ({
    name,
    baseOptions,
  }: {
    name: string;
    baseOptions: OnlyExportComponentsOptions;
  }) =>
  (options?: OnlyExportComponentsOptions) => ({
    name: `react-refresh/${name}`,
    plugins: { "react-refresh": plugin },
    rules: {
      "react-refresh/only-export-components": [
        "error",
        { ...baseOptions, ...options },
      ],
    },
  });

const configs = {
  recommended: buildConfig({ name: "recommended", baseOptions: {} }),
  vite: buildConfig({
    name: "vite",
    baseOptions: { allowConstantExport: true },
  }),
  next: buildConfig({
    name: "next",
    baseOptions: {
      allowExportNames: [
        // https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
        "experimental_ppr",
        "dynamic",
        "dynamicParams",
        "revalidate",
        "fetchCache",
        "runtime",
        "preferredRegion",
        "maxDuration",
        // https://nextjs.org/docs/app/api-reference/functions/generate-metadata
        "metadata",
        "generateMetadata",
        // https://nextjs.org/docs/app/api-reference/functions/generate-viewport
        "viewport",
        "generateViewport",
        // https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata
        "generateImageMetadata",
        // https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
        "generateSitemaps",
        // https://nextjs.org/docs/app/api-reference/functions/generate-static-params
        "generateStaticParams",
      ],
    },
  }),
};

export const reactRefresh = { plugin, configs };

/** Prefer reactRefresh export which exposed configs as functions */
export default {
  rules,
  configs: {
    recommended: configs.recommended(),
    vite: configs.vite(),
    next: configs.next(),
  },
};
