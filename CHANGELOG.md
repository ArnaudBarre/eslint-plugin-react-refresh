# Changelog

## Unreleased

- Fix detection of local components to not generate warning on for variable inside JSX files that follow React component naming 

## 0.4.16

Fix CJS/ESM interop issue. Sorry everyone for the trouble.

## 0.4.15

### Add support for custom HOCs (#60)

By default, the rule only knows that `memo` & `forwardRef` function calls with return a React component. With this option, you can also allow extra function names like Mobx observer to make this code valid:

```tsx
const Foo = () => <></>;
export default observer(Foo);
```

```json
{
  "react-refresh/only-export-components": [
    "error",
    { "customHOCs": ["observer"] }
  ]
}
```

Thanks @HorusGoul!

### Add recommended config and simple types (#67)

You can now add the recommended config to your ESLint config like this:

```js
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  /* Main config */
  reactRefresh.configs.recommended, // Or reactRefresh.configs.vite for Vite users
];
```

To follow ESLint recommandations, the rule is added with the `error` severity.

Some simple types ensure that people typecheking their config won't need `@ts-expect-error` anymore.

### Bump ESLint peer dependency to 8.40

This was actually done by mistake in the previous release when moving from a deprecated API to a new one.

Given that ESLint 8 is officialy end-of-life and the only report (#56) didn't get likes, I'm going forward and documenting the expected minimum version from ESLin in the package JSON so that people can get warning from their package manager.

## 0.4.14

- Warn if a context is exported alongside a component (fixes #53). Thanks @IgorAufricht!

## 0.4.13

- Support for `react-redux` connect (`export default connect(mapStateToProps, mapDispatchToProps)(MyComponent)`) (fixes #51)
- Support for [Arbitrary Module Identifiers](https://devblogs.microsoft.com/typescript/announcing-typescript-5-6/#support-for-arbitrary-module-identifiers) syntax (fixes #52)

## 0.4.12

- Support type assertion on default export (fixes #48)
- Add default export to fix usage with jiti (fixes #50)

## 0.4.11

- Ignore type exports (ex. `export type foo = string;`) (fixes #47)

## 0.4.10

- Support `function Foo() {}; export default React.memo(Foo)` (#46) (thanks @SukkaW!)

## 0.4.9

- Support `function Foo() {}; export default memo(Foo)` (fixes #44) (thanks @SukkaW!)

## 0.4.8

- Support `export const foo = -1` with `allowConstantExport` (fixes #43)

## 0.4.7

- Support `export { Component as default }` (fixes #41)

## 0.4.6

- Ignore cypress test files (#39)

## 0.4.5

- Allow `TaggedTemplateExpression` for styled components (fixes #32)

## 0.4.4

- Add `allowExportNames` option (fixes #29)
- Support memo default export function components (fixes #27)
- Warn on export expressions that are not React component (array, object, logical expression, ...) (fixes #26)

## 0.4.3

- Add warning for TS enums exports

## 0.4.2

- Fix typos in messages (#15, #16). Thanks @adamschachne & @janikga!

## 0.4.1

- Ignore `export type *` (fixes #12)
- Support for all-uppercase function wrapped in forwardRef/memo (#11)

## 0.4.0

### Add `allowConstantExport` option (fixes #8)

This option allow to don't warn when a constant (string, number, boolean, templateLiteral) is exported aside one or more components.

This should be enabled if the fast refresh implementation correctly handles this case (HMR when the constant doesn't change, propagate update to importers when the constant changes). Vite supports it, PR welcome if you notice other integrations works well.

### Allow all-uppercase function exports (fixes #11)

This only works when using direct export. So this pattern doesn't warn anymore:

```jsx
export const CMS = () => <></>;
```

But this one will still warn:

```jsx
const CMS = () => <></>;
export default CMS;
```

## 0.3.5

Ignore stories files (`*.stories.*`) (fixes #10)

## 0.3.4

Report default CallExpression exports (#7) (fixes #6)

This allows to report a warning for this kind of patterns that creates anonymous components:

`export default compose()(MainComponent)`

## 0.3.3

Add checkJS option (#5) (fixes #4)

## 0.3.2

Ignore test files (`*.test.*`, `*.spec.*`) (fixes #2)

## 0.3.1

Allow numbers in component names (fixes #1)

## 0.3.0

Report an error when a file that contains components that can't be fast-refreshed because:

- There are no export (entrypoint)
- Exports are not components

## 0.2.1

Doc only: Update limitations section README.md

## 0.2.0

- Fix TS import
- Document limitations

## 0.1.0

Initial release
