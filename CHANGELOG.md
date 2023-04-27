# Changelog

## 0.3.5

Ignore stories files (`*.stories.*`) (Fixes #10)

## 0.3.4

Report default CallExpression exports (#7) (Fixes #6)

This allows to report a warning for this kind of patterns that creates anonymous components:

`export default compose()(MainComponent)`

## 0.3.3

Add checkJS option (#5) (Fixes #4)

## 0.3.2

Ignore test files (`*.test.*`, `*.spec.*`) (Fixes #2)

## 0.3.1

Allow numbers in component names (Fixes #1)

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
