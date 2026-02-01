import parser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { onlyExportComponents } from "./only-export-components.ts";
import type { OnlyExportComponentsOptions } from "./types.d.ts";

const ruleTester = new RuleTester({ languageOptions: { parser } });

const valid: {
  name: string;
  code: string;
  filename?: string;
  options?: OnlyExportComponentsOptions;
}[] = [
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
    name: "Direct export AF component with underscore",
    code: "export const Foo_ = () => {};",
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
    name: "styled components",
    code: "export const Foo = () => {}; export const Bar = styled.div`padding-bottom: 6px;`;",
    options: { extraHOCs: ["styled"] },
  },
  {
    name: "styled components",
    code: "export const Foo = () => {}; export const Flex = styled.div({ display: 'flex' });",
    options: { extraHOCs: ["styled"] },
  },
  {
    name: "Curried HOC with styled (object form)",
    code: "export const Foo = () => {}; export const Flex = styled('div')({display: 'flex'});",
    options: { extraHOCs: ["styled"] },
  },
  {
    name: "Curried HOC with styled (template literal form)",
    code: "export const Foo = () => {}; export const Flex = styled('div')`display: flex;`;",
    options: { extraHOCs: ["styled"] },
  },
  {
    name: "Curried HOC only first call",
    code: "export const Foo = () => {}; export const Flex = styled('div');",
    options: { extraHOCs: ["styled"] },
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
    name: "export default memo function",
    code: "export default memo(function Foo () {});",
  },
  {
    name: "export default React.memo function",
    code: "export default React.memo(function Foo () {});",
  },
  {
    name: "export default memo function assignment",
    code: "const Foo = () => {}; export default memo(Foo);",
  },
  {
    name: "export default React.memo function assignment",
    code: "const Foo = () => {}; export default React.memo(Foo);",
  },
  {
    name: "export default memo function declaration",
    code: "function Foo() {}; export default memo(Foo);",
  },
  {
    name: "export default React.memo function declaration",
    code: "function Foo() {}; export default React.memo(Foo);",
  },
  {
    name: "export default React.memo function declaration with type assertion",
    code: "function Foo() {}; export default React.memo(Foo) as typeof Foo;",
  },
  {
    name: "export type *",
    code: "export type * from './module';",
    filename: "Test.tsx",
  },
  {
    name: "export type { foo }",
    code: "type foo = string; export const Foo = () => null; export type { foo };",
    filename: "Test.tsx",
  },
  {
    name: "export type foo",
    code: "export type foo = string; export const Foo = () => null;",
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
    options: { checkJS: true },
  },
  {
    name: "Component and number constant with allowConstantExport",
    code: "export const foo = 4; export const Bar = () => {};",
    options: { allowConstantExport: true },
  },
  {
    name: "Component and negative number constant with allowConstantExport",
    code: "export const foo = -4; export const Bar = () => {};",
    options: { allowConstantExport: true },
  },
  {
    name: "Component and string constant with allowConstantExport",
    code: "export const CONSTANT = 'Hello world'; export const Foo = () => {};",
    options: { allowConstantExport: true },
  },
  {
    name: "Component and template literal with allowConstantExport",
    // eslint-disable-next-line no-template-curly-in-string
    code: "const foo = 'world'; export const CONSTANT = `Hello ${foo}`; export const Foo = () => {};",
    options: { allowConstantExport: true },
  },
  {
    name: "Component and allowed export",
    code: "export const loader = () => {}; export const Bar = () => {};",
    options: { allowExportNames: ["loader", "meta"] },
  },
  {
    name: "Component and allowed function export",
    code: "export function loader() {}; export const Bar = () => {};",
    options: { allowExportNames: ["loader", "meta"] },
  },
  {
    name: "Only allowed exports without component",
    code: "export const loader = () => {}; export const meta = { title: 'Home' };",
    options: { allowExportNames: ["loader", "meta"] },
  },
  {
    name: "Component and viewport export for Next.js",
    code: "export const viewport = { width: 'device-width', initialScale: 1 }; export const Page = () => {};",
    options: { allowExportNames: ["viewport"] },
  },
  {
    name: "Export as default",
    code: "export { App as default }; const App = () => <>Test</>;",
  },
  {
    name: "Allow connect from react-redux",
    code: "const MyComponent = () => {}; export default connect(() => ({}))(MyComponent);",
    options: { extraHOCs: ["connect"] },
  },
  {
    name: "Two components, one of them with 'Context' in its name",
    code: "export const MyComponent = () => {}; export const ChatContext = () => {};",
  },
  {
    name: "Component & local React context",
    code: "export const MyComponent = () => {}; const MyContext = createContext('test');",
  },
  {
    name: "Only React context",
    code: "export const MyContext = createContext('test');",
  },
  {
    name: "Custom HOCs like mobx's observer",
    code: "const MyComponent = () => {}; export default observer(MyComponent);",
    options: { extraHOCs: ["observer"] },
  },
  {
    name: "Local constant with component casing and non component function",
    code: "const SomeConstant = 42; export function someUtility() { return SomeConstant }",
  },
  {
    name: "Component and as const constant with allowConstantExport",
    code: "export const MyComponent = () => {}; export const MENU_WIDTH = 232 as const;",
    options: { allowConstantExport: true },
  },
  {
    name: "Type assertion in memo export",
    code: "export const MyComponent = () => {}; export default memo(MyComponent as any);",
  },
  {
    name: "Type assertion for memo export",
    code: "export const MyComponent = () => {}; export default memo(MyComponent) as any;",
  },
  {
    name: "Nested memo HOC",
    code: "export const MyComponent = () => {}; export default memo(forwardRef(MyComponent));",
  },
  {
    name: "Allow ternaries if both branches are components",
    code: "export const Devtools = import.meta.env.PROD ? () => null : React.lazy(() => import('devtools')); export const OtherComponent = () => {};",
  },
  {
    name: "TanStack Router",
    code: "const RootComponent = () => {}; export const Route = createRootRoute()({ component: RootComponent });",
    options: { extraHOCs: ["createRootRoute"] },
  },
  {
    name: "Rename export",
    code: "export const Link = () => {}; export const RenamedLink = Link;",
  },
  {
    name: "Type instantiation expression",
    code: "export const Link = () => {}; export const TypedLink = Link<RouteParams>;",
  },
  {
    name: "Class component",
    code: "export class MyComponent extends React.Component<Props, State> { render() { return <div>Hello</div>; } }",
  },
  {
    name: "Export default class component",
    code: "export default class MyComponent extends Component { render() { return <div>Hello</div>; } }",
  },
];

const invalid: {
  name: string;
  code: string;
  errorId: string;
  filename?: string;
  options?: OnlyExportComponentsOptions;
}[] = [
  {
    name: "Component and function",
    code: "export const foo = () => {}; export const Bar = () => {};",
    errorId: "namedExport",
  },
  {
    name: "Component and underscored component",
    code: "export const _Foo = () => {}; export const Foo = () => {};",
    errorId: "namedExport",
  },
  {
    name: "Component and function with allowConstantExport",
    code: "export const foo = () => {}; export const Bar = () => {};",
    errorId: "namedExport",
    options: { allowConstantExport: true },
  },
  {
    name: "Component and variable (direct export)",
    code: "export const foo = 4; export const Bar = () => {};",
    errorId: "namedExport",
  },
  {
    name: "Component and PascalCase variable",
    code: "export function Component() {}; export const Aa = 'a'",
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
    name: "export default anonymous memo AF",
    code: "export default memo(() => {});",
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
    options: { checkJS: true },
    errorId: "namedExport",
  },
  {
    name: "export default compose",
    code: "const MainView = () => {}; export default compose()(MainView);",
    filename: "Test.jsx",
    errorId: "localComponents",
  },
  {
    name: "Component and export non in allowExportNames",
    code: "export const loader = () => {}; export const Bar = () => {}; export const foo = () => {};",
    options: { allowExportNames: ["loader", "meta"] },
    errorId: "namedExport",
  },
  {
    name: "Export with arbitrary module identifier",
    code: 'const Foo = () => {}; export { Foo as "🍌"}',
    errorId: "localComponents",
  },
  {
    name: "Component and React Context",
    code: "export const MyComponent = () => {}; export const MyContext = createContext('test');",
    errorId: "reactContext",
  },
  {
    name: "Component and React Context with React import",
    code: "export const MyComponent = () => {}; export const MyContext = React.createContext('test');",
    errorId: "reactContext",
  },
  {
    name: "should be invalid when custom HOC is used without adding it to the rule configuration",
    code: "const MyComponent = () => {}; export default observer(MyComponent);",
    errorId: "localComponents",
  },
  {
    name: "Object.keys",
    code: "const MyComponent = () => {}; export const ENUM = Object.keys(TABLE) as EnumType[];",
    errorId: "localComponents",
  },
  {
    name: "Don't allow ternaries if a branch is not a component",
    code: "export const DevtoolsNotComponentInProd = import.meta.env.PROD ? null : React.lazy(() => import('devtools')); export const OtherComponent = () => {};",
    errorId: "namedExport",
  },
  {
    name: "Component and non React Class component",
    code: "export const Foo = () => {}; export class MyComponent { bar() { return <div>Hello</div>; } }",
    errorId: "namedExport",
  },
  {
    name: "Export default anonymous class component",
    code: "export default class { bar() { return <div>Hello</div>; } }",
    errorId: "anonymousExport",
  },
];

const it = (name: string, cases: Parameters<typeof ruleTester.run>[2]) => {
  ruleTester.run(
    name,
    // @ts-expect-error Mismatch between typescript-eslint and eslint
    onlyExportComponents,
    cases,
  );
};

for (const { name, code, filename, options } of valid) {
  it(name, {
    valid: [
      {
        code,
        filename: filename ?? "Test.tsx",
        options: options ? [options] : [],
      },
    ],
    invalid: [],
  });
}

for (const { name, code, errorId, filename, options } of invalid) {
  it(name, {
    valid: [],
    invalid: [
      {
        filename: filename ?? "Test.jsx",
        code,
        errors: Array.isArray(errorId)
          ? errorId.map((messageId) => ({ messageId }))
          : [{ messageId: errorId }],
        options: options ? [options] : [],
      },
    ],
  });
}
