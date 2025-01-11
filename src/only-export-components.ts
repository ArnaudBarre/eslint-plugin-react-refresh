import type { TSESLint } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/types";

const reactComponentNameRE = /^[A-Z][a-zA-Z0-9]*$/u;

export const onlyExportComponents: TSESLint.RuleModule<
  | "exportAll"
  | "namedExport"
  | "anonymousExport"
  | "noExport"
  | "localComponents"
  | "reactContext",
  | []
  | [
      {
        allowExportNames?: string[];
        allowConstantExport?: boolean;
        customHOCs?: string[];
        checkJS?: boolean;
      },
    ]
> = {
  meta: {
    messages: {
      exportAll:
        "This rule can't verify that `export *` only exports components.",
      namedExport:
        "Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components.",
      anonymousExport:
        "Fast refresh can't handle anonymous components. Add a name to your export.",
      localComponents:
        "Fast refresh only works when a file only exports components. Move your component(s) to a separate file.",
      noExport:
        "Fast refresh only works when a file has exports. Move your component(s) to a separate file.",
      reactContext:
        "Fast refresh only works when a file only exports components. Move your React context(s) to a separate file.",
    },
    type: "problem",
    schema: [
      {
        type: "object",
        properties: {
          allowExportNames: { type: "array", items: { type: "string" } },
          allowConstantExport: { type: "boolean" },
          customHOCs: { type: "array", items: { type: "string" } },
          checkJS: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: (context) => {
    const {
      allowExportNames,
      allowConstantExport = false,
      customHOCs = [],
      checkJS = false,
    } = context.options[0] ?? {};
    const filename = context.filename;
    // Skip tests & stories files
    if (
      filename.includes(".test.") ||
      filename.includes(".spec.") ||
      filename.includes(".cy.") ||
      filename.includes(".stories.")
    ) {
      return {};
    }
    const shouldScan =
      filename.endsWith(".jsx") ||
      filename.endsWith(".tsx") ||
      (checkJS && filename.endsWith(".js"));
    if (!shouldScan) return {};

    const allowExportNamesSet = allowExportNames
      ? new Set(allowExportNames)
      : undefined;

    const reactHOCs = ["memo", "forwardRef", ...customHOCs];
    const canBeReactFunctionComponent = (init: TSESTree.Expression | null) => {
      if (!init) return false;
      if (init.type === "ArrowFunctionExpression") return true;
      if (init.type === "CallExpression" && init.callee.type === "Identifier") {
        return reactHOCs.includes(init.callee.name);
      }
      return false;
    };

    return {
      Program(program) {
        let hasExports = false;
        let hasReactExport = false;
        let reactIsInScope = false;
        const localComponents: TSESTree.Identifier[] = [];
        const nonComponentExports: (
          | TSESTree.BindingName
          | TSESTree.StringLiteral
        )[] = [];
        const reactContextExports: TSESTree.Identifier[] = [];

        const handleExportIdentifier = (
          identifierNode: TSESTree.BindingName | TSESTree.StringLiteral,
          isFunction?: boolean,
          init?: TSESTree.Expression | null,
        ) => {
          if (identifierNode.type !== "Identifier") {
            nonComponentExports.push(identifierNode);
            return;
          }
          if (allowExportNamesSet?.has(identifierNode.name)) return;
          if (
            allowConstantExport &&
            init &&
            (init.type === "Literal" || // 1, "foo"
              init.type === "UnaryExpression" || // -1
              init.type === "TemplateLiteral" || // `Some ${template}`
              init.type === "BinaryExpression") // 24 * 60
          ) {
            return;
          }

          if (isFunction) {
            if (reactComponentNameRE.test(identifierNode.name)) {
              hasReactExport = true;
            } else {
              nonComponentExports.push(identifierNode);
            }
          } else {
            if (
              init &&
              init.type === "CallExpression" &&
              // createContext || React.createContext
              ((init.callee.type === "Identifier" &&
                init.callee.name === "createContext") ||
                (init.callee.type === "MemberExpression" &&
                  init.callee.property.type === "Identifier" &&
                  init.callee.property.name === "createContext"))
            ) {
              reactContextExports.push(identifierNode);
              return;
            }
            if (
              init &&
              // Switch to allowList?
              notReactComponentExpression.has(init.type)
            ) {
              nonComponentExports.push(identifierNode);
              return;
            }
            if (reactComponentNameRE.test(identifierNode.name)) {
              hasReactExport = true;
            } else {
              nonComponentExports.push(identifierNode);
            }
          }
        };

        const handleExportDeclaration = (node: TSESTree.ExportDeclaration) => {
          if (node.type === "VariableDeclaration") {
            for (const variable of node.declarations) {
              handleExportIdentifier(
                variable.id,
                canBeReactFunctionComponent(variable.init),
                variable.init,
              );
            }
          } else if (node.type === "FunctionDeclaration") {
            if (node.id === null) {
              context.report({ messageId: "anonymousExport", node });
            } else {
              handleExportIdentifier(node.id, true);
            }
          } else if (node.type === "CallExpression") {
            if (
              node.callee.type === "CallExpression" &&
              node.callee.callee.type === "Identifier" &&
              node.callee.callee.name === "connect"
            ) {
              // support for react-redux
              // export default connect(mapStateToProps, mapDispatchToProps)(Comp)
              hasReactExport = true;
            } else if (node.callee.type !== "Identifier") {
              // we rule out non HoC first
              // export default React.memo(function Foo() {})
              // export default Preact.memo(function Foo() {})
              if (
                node.callee.type === "MemberExpression" &&
                node.callee.property.type === "Identifier" &&
                reactHOCs.includes(node.callee.property.name)
              ) {
                hasReactExport = true;
              } else {
                context.report({ messageId: "anonymousExport", node });
              }
            } else if (!reactHOCs.includes(node.callee.name)) {
              // we rule out non HoC first
              context.report({ messageId: "anonymousExport", node });
            } else if (
              node.arguments[0]?.type === "FunctionExpression" &&
              node.arguments[0].id
            ) {
              // export default memo(function Foo() {})
              handleExportIdentifier(node.arguments[0].id, true);
            } else if (node.arguments[0]?.type === "Identifier") {
              // const Foo = () => {}; export default memo(Foo);
              // No need to check further, the identifier has necessarily a named,
              // and it would throw at runtime if it's not a React component.
              // We have React exports since we are exporting return value of HoC
              hasReactExport = true;
            } else {
              context.report({ messageId: "anonymousExport", node });
            }
          } else if (node.type === "TSEnumDeclaration") {
            nonComponentExports.push(node.id);
          }
        };

        for (const node of program.body) {
          if (node.type === "ExportAllDeclaration") {
            if (node.exportKind === "type") continue;
            hasExports = true;
            context.report({ messageId: "exportAll", node });
          } else if (node.type === "ExportDefaultDeclaration") {
            hasExports = true;
            const declaration =
              node.declaration.type === "TSAsExpression" ||
              node.declaration.type === "TSSatisfiesExpression"
                ? node.declaration.expression
                : node.declaration;
            if (
              declaration.type === "VariableDeclaration" ||
              declaration.type === "FunctionDeclaration" ||
              declaration.type === "CallExpression"
            ) {
              handleExportDeclaration(declaration);
            }
            if (declaration.type === "Identifier") {
              handleExportIdentifier(declaration);
            }
            if (declaration.type === "ArrowFunctionExpression") {
              context.report({ messageId: "anonymousExport", node });
            }
          } else if (node.type === "ExportNamedDeclaration") {
            if (node.exportKind === "type") continue;
            hasExports = true;
            if (node.declaration) handleExportDeclaration(node.declaration);
            for (const specifier of node.specifiers) {
              handleExportIdentifier(
                specifier.exported.type === "Identifier" &&
                  specifier.exported.name === "default"
                  ? specifier.local
                  : specifier.exported,
              );
            }
          } else if (node.type === "VariableDeclaration") {
            for (const variable of node.declarations) {
              if (
                variable.id.type === "Identifier" &&
                reactComponentNameRE.test(variable.id.name) &&
                canBeReactFunctionComponent(variable.init)
              ) {
                localComponents.push(variable.id);
              }
            }
          } else if (node.type === "FunctionDeclaration") {
            if (reactComponentNameRE.test(node.id.name)) {
              localComponents.push(node.id);
            }
          } else if (
            node.type === "ImportDeclaration" &&
            node.source.value === "react"
          ) {
            reactIsInScope = true;
          }
        }

        if (checkJS && !reactIsInScope) return;

        if (hasExports) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (hasReactExport) {
            for (const node of nonComponentExports) {
              context.report({ messageId: "namedExport", node });
            }
            for (const node of reactContextExports) {
              context.report({ messageId: "reactContext", node });
            }
          } else if (localComponents.length) {
            for (const node of localComponents) {
              context.report({ messageId: "localComponents", node });
            }
          }
        } else if (localComponents.length) {
          for (const node of localComponents) {
            context.report({ messageId: "noExport", node });
          }
        }
      },
    };
  },
};

type ToString<T> = T extends `${infer V}` ? V : never;
const notReactComponentExpression = new Set<
  ToString<TSESTree.Expression["type"]>
>([
  "ArrayExpression",
  "AwaitExpression",
  "BinaryExpression",
  "ChainExpression",
  "ConditionalExpression",
  "Literal",
  "LogicalExpression",
  "ObjectExpression",
  "TemplateLiteral",
  "ThisExpression",
  "UnaryExpression",
  "UpdateExpression",
]);
