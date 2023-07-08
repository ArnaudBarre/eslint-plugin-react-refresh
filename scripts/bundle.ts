#!/usr/bin/env tnode
import { rmSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { build } from "esbuild";

import packageJSON from "../package.json";

rmSync("dist", { force: true, recursive: true });

build({
  bundle: true,
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  platform: "node",
  target: "node14",
  external: Object.keys(packageJSON.peerDependencies),
}).then(() => {
  execSync("cp LICENSE README.md dist/");

  writeFileSync(
    "dist/package.json",
    JSON.stringify(
      {
        name: packageJSON.name,
        description:
          "Validate that your components can safely be updated with fast refresh",
        version: packageJSON.version,
        author: "Arnaud Barré (https://github.com/ArnaudBarre)",
        license: packageJSON.license,
        repository: "github:ArnaudBarre/eslint-plugin-react-refresh",
        main: "index.js",
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
});
