#!/usr/bin/env tnode
import { test } from "bun:test";
import { RuleTester } from "eslint";
import { onlyExportComponents } from "./only-export-components.ts";

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2022,
    ecmaFeatures: { jsx: true },
  },
});

const valid = [
  {
    name: "Direct export named component",
    code: "export function Foo() {};",
  },
  {
    name: "Export named component",
    code: "function Foo() {}; export { Foo };",
  },
  {
    name: "Export default named component",
    code: "function Foo() {}; export default Foo;",
  },
  {
    name: "Direct export default named component",
    code: "export default function Foo() {}",
  },
  {
    name: "Direct export AF component",
    code: "export const Foo = () => {};",
  },
  {
    name: "Direct export AF component with number",
    code: "export const Foo2 = () => {};",
  },
  {
    name: "Direct export uppercase function",
    code: "export function CMS() {};",
  },
  {
    name: "Uppercase component with forwardRef",
    code: "export const SVG = forwardRef(() => <svg/>);",
  },
  {
    name: "Direct export uppercase component",
    code: "export const CMS = () => {};",
  },
  {
    name: "Export AF component",
    code: "const Foo = () => {}; export { Foo };",
  },
  {
    name: "Default export AF component",
    code: "const Foo = () => {}; export default Foo;",
  },
  {
    name: "Two components & local variable",
    code: "const foo = 4; export const Bar = () => {}; export const Baz = () => {};",
  },
  {
    name: "Two components & local function",
    code: "const foo = () => {}; export const Bar = () => {}; export const Baz = () => {};",
  },
  {
    name: "Direct export variable",
    code: "export const foo = 3;",
  },
  {
    name: "Export variables",
    code: "const foo = 3; const bar = 'Hello'; export { foo, bar };",
  },
  {
    name: "Direct export AF",
    code: "export const foo = () => {};",
  },
  {
    name: "Direct export default AF",
    code: "export default function foo () {};",
  },
  {
    name: "export type *",
    code: "export type * from './module';",
    filename: "Test.tsx",
  },
  {
    name: "Mixed export in JS without checkJS",
    code: "export const foo = () => {}; export const Bar = () => {};",
    filename: "Test.js",
  },
  {
    name: "Mixed export in JS without react import",
    code: "export const foo = () => {}; export const Bar = () => {};",
    filename: "Test.js",
    options: [{ checkJS: true }],
  },
  {
    name: "Component and number constant with allowConstantExport",
    code: "export const foo = 4; export const Bar = () => {};",
    options: [{ allowConstantExport: true }],
  },
  {
    name: "Component and string constant with allowConstantExport",
    code: "export const CONSTANT = 'Hello world'; export const Foo = () => {};",
    options: [{ allowConstantExport: true }],
  },
  {
    name: "Component and template literal with allowConstantExport",
    code: "const foo = 'world'; export const CONSTANT = `Hello ${foo}`; export const Foo = () => {};",
    options: [{ allowConstantExport: true }],
  },
];

const invalid = [
  {
    name: "Component and function",
    code: "export const foo = () => {}; export const Bar = () => {};",
    errorId: "namedExport",
  },
  {
    name: "Component and function with allowConstantExport",
    code: "export const foo = () => {}; export const Bar = () => {};",
    errorId: "namedExport",
    options: [{ allowConstantExport: true }],
  },
  {
    name: "Component and variable (direct export)",
    code: "export const foo = 4; export const Bar = () => {};",
    errorId: "namedExport",
  },
  {
    name: "Component and variable",
    code: "const foo = 4; const Bar = () => {}; export { foo, Bar };",
    errorId: "namedExport",
  },
  {
    name: "Export all",
    code: "export * from './foo';",
    errorId: "exportAll",
  },
  {
    name: "Export default anonymous AF",
    code: "export default () => {};",
    errorId: "anonymousExport",
  },
  {
    name: "Export default anonymous function",
    code: "export default function () {};",
    errorId: "anonymousExport",
  },
  {
    name: "Component and constant",
    code: "export const CONSTANT = 3; export const Foo = () => {};",
    errorId: "namedExport",
  },
  {
    name: "Component and enum",
    code: "export enum Tab { Home, Settings }; export const Bar = () => {};",
    errorId: "namedExport",
  },
  {
    name: "Unexported component and export",
    code: "const Tab = () => {}; export const tabs = [<Tab />, <Tab />];",
    errorId: "localComponents",
  },
  {
    name: "Unexported component and no export",
    code: "const App = () => {}; createRoot(document.getElementById('root')).render(<App />);",
    errorId: "noExport",
  },
  {
    name: "Mixed export in JS with react import",
    code: `
     import React from 'react';
     export const CONSTANT = 3; export const Foo = () => {};
    `,
    filename: "Test.js",
    options: [{ checkJS: true }],
    errorId: "namedExport",
  },
  {
    name: "export default compose",
    code: `export default compose()(MainView);`,
    filename: "Test.jsx",
    errorId: "anonymousExport",
  },
];

const it = (name: string, cases: Parameters<typeof ruleTester.run>[2]) => {
  test(name, () => {
    ruleTester.run(
      "only-export-components",
      // @ts-ignore Mismatch between typescript-eslint and eslint
      onlyExportComponents,
      cases,
    );
  });
};

valid.forEach(({ name, code, filename, options = [] }) => {
  it(name, {
    valid: [{ filename: filename ?? "Test.jsx", code, options }],
    invalid: [],
  });
});

invalid.forEach(({ name, code, errorId, filename, options = [] }) => {
  it(name, {
    valid: [],
    invalid: [
      {
        filename: filename ?? "Test.jsx",
        code,
        errors: [{ messageId: errorId }],
        options,
      },
    ],
  });
});
