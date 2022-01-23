# eslint-plugin-react-refresh [![npm](https://img.shields.io/npm/v/eslint-plugin-react-refresh)](https://www.npmjs.com/package/eslint-plugin-react-refresh)

Validate that your components can safely be updated with fast refresh.

⚠️ To avoid false positive, this plugin is only applied on `tsx` & `jsx` files.

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
