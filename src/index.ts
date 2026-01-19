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
  next: {
    name: "react-refresh/next",
    plugins: { "react-refresh": plugin },
    rules: {
      "react-refresh/only-export-components": [
        "error",
        {
          allowExportNames: [
            // https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
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
      ],
    },
  },
};

// Probably not needed, but keep for backwards compatibility
export default { rules, configs };
