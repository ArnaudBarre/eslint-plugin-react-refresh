#!/usr/bin/env node
import { rmSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { build } from "esbuild";

import packageJSON from "../package.json" with { type: "json" };

rmSync("dist", { force: true, recursive: true });

await build({
  bundle: true,
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  platform: "node",
  format: "esm",
  target: "node20",
  external: Object.keys(packageJSON.peerDependencies),
});

execSync("cp LICENSE README.md dist/");
execSync("cp src/types.d.ts dist/index.d.ts");

writeFileSync(
  "dist/package.json",
  JSON.stringify(
    {
      name: packageJSON.name,
      description:
        "Validate that your components can safely be updated with Fast Refresh",
      version: packageJSON.version,
      type: "module",
      author: "Arnaud Barré (https://github.com/ArnaudBarre)",
      license: packageJSON.license,
      repository: "github:ArnaudBarre/eslint-plugin-react-refresh",
      exports: {
        ".": {
          types: "./index.d.ts",
          default: "./index.js",
        },
      },
      keywords: [
        "eslint",
        "eslint-plugin",
        "react",
        "react-refresh",
        "fast refresh",
      ],
      peerDependencies: packageJSON.peerDependencies,
    },
    null,
    2,
  ),
);
