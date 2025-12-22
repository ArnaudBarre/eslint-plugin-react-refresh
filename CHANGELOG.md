# Changelog

## 0.5.0

### Breaking changes

- Packages now ships as ESM and requires ESLint 9 + node 20
- Validation of HOCs calls is now more strict, you may need to add some HOCs to the `customHOCs` option
- Configs are now functions that return the config object with passed options merged with the base options of that config

Example:

```js
import { defineConfig } from "eslint/config";
import reactRefresh from "eslint-plugin-react-refresh";

export default defineConfig(
  /* Main config */
  reactRefresh.configs.vite({ customHOCs: ["connect"] }),
);
```

### Why

This version follows a revamp of the internal logic to better make the difference between random call expressions like `export const Enum = Object.keys(Record)` and actual React HOC calls like `export const MemoComponent = memo(Component)`. (fixes [#93](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/issues/93))

The rule now handles ternaries and patterns like `export default customHOC(props)(Component)` which makes it able to correctly support files like [this one](https://github.com/eclipse-apoapsis/ort-server/blob/ddfc624ce71b9f2ca6bad9b8c82d4c3249dd9c8b/ui/src/routes/__root.tsx) given this config:

```json
{
  "react-refresh/only-export-components": [
    "warn",
    { "customHOCs": ["createRootRouteWithContext"] }
  ]
}
```

> [!NOTE]
> Actually createRoute functions from TanStack Router are not React HOCs, they return route objects that [fake to be a memoized component](https://github.com/TanStack/router/blob/8628d0189412ccb8d3a01840aa18bac8295e18c8/packages/react-router/src/route.tsx#L263) but are not. When only doing `createRootRoute({ component: Foo })`, HMR will work fine, but as soon as you add a prop to the options that is not a React component, HMR will not work. I would recommend to avoid adding any TanStack function to `customHOCs` it you want to preserve good HMR in the long term. [Bluesky thread](https://bsky.app/profile/arnaud-barre.bsky.social/post/3ma5h5tf2sk2e).

Because I'm not 100% sure this new logic doesn't introduce any false positive, this is done in a major-like version. This also give me the occasion to remove the hardcoded `connect` from the rule. If you are using `connect` from `react-redux`, you should now add it to `customHOCs` like this:

```json
{
  "react-refresh/only-export-components": [
    "warn",
    { "customHOCs": ["connect"] }
  ]
}
```

## 0.4.26

- Revert changes to fix [#93](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/issues/93) (fixes [#95](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/issues/95))

## 0.4.25

- Report cases like `export const ENUM = Object.keys(TABLE) as EnumType[];` (fixes [#93](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/issues/93)) (reverted in 0.4.26)
- Allow `_` in component names ([#94](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/pull/94))

## 0.4.24

- Add `"generateImageMetadata"`, `"generateSitemaps"` & `"generateStaticParams"` to `allowExportNames` in Next config

## 0.4.23

- Add `"metadata"`, `"generateMetadata"` & `"generateViewport"` to `allowExportNames` in Next config

## 0.4.22

- Add `"viewport"` to `allowExportNames` in Next config ([#89](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/pull/89))

## 0.4.21

- Add Next config (fixes [#85](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/issues/85))

This allows exports like `fetchCache` and `revalidate` which are used in Page or Layout components and don't trigger a full page reload.

```js
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  /* Main config */
  reactRefresh.configs.next,
];
```

## 0.4.20

- Don't warn on nested HOC calls (fixes [#79](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/issues/79))
- Fix false positive with `as const` (fixes [#80](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/issues/80))

## 0.4.19

Add name to configs for [ESLint Config Inspector](https://github.com/eslint/config-inspector)

## 0.4.18

ESM/CJS interop is the worse that happened to this ecosystem, this is all I have to say.

## 0.4.17

- Fix detection of local components to not generate warning on for variable inside JSX files that follow React component naming (fixes #75)
- Update types to not require extra unnecessary `.default` property access under TS node16 module resolution (fixes #70)

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
