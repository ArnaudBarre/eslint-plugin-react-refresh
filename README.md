# eslint-plugin-react-refresh [![npm](https://img.shields.io/npm/v/eslint-plugin-react-refresh)](https://www.npmjs.com/package/eslint-plugin-react-refresh)

Validate that your components can safely be updated with fast refresh.

## Limitations

⚠️ To avoid false positive, this plugin is only applied on `tsx` & `jsx` files ⚠️

Like the implementation for [vite](https://github.com/vitejs/vite/blob/e6495f0a52c9bd2cae166934dc965f8955ce035d/packages/plugin-react/src/fast-refresh.ts#L108), the plugin rely on naming conventions (i.e. use ). This is why there is some limitations:

- `export *` are not supported and will be reported as an error
- anonymous function are not supported (i.e `export default function() {}`)
- Full uppercase export would be considered as an error. It can be disabled locally when it's effectively a React component:

```jsx
// eslint-disable-next-line react-refresh/eslint-plugin-react-refresh
export const CMS = () => <></>;
```

## Installation

```sh
npm i -D eslint-plugin-react-refresh
```

## Usage

```json
{
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": "warn"
  }
}
```

## Fail

```jsx
export const foo = () => {};
export const Bar = () => <></>;
```

```jsx
export const CONSTANT = 3;
export const Foo = () => <></>;
```

```jsx
export default function () {}
```

```jsx
export * from "./foo";
```

## Pass

```jsx
export default function Foo() {
  return <></>;
}
```

```jsx
const foo = () => {};
export const Bar = () => <></>;
```
