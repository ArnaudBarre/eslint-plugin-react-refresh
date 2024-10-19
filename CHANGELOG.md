# Changelog

## Unreleased

- Support for `react-redux` connect (`export default connect(mapStateToProps, mapDispatchToProps)(MyComponent)`) (fixes #51)

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
