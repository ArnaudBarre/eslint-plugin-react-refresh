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
      const jsInit = skipTSWrapper(init);
      if (jsInit.type === "ArrowFunctionExpression") return true;
      if (
        jsInit.type === "CallExpression" &&
        jsInit.callee.type === "Identifier"
      ) {
        return reactHOCs.includes(jsInit.callee.name);
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
            constantExportExpressions.has(skipTSWrapper(init).type)
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

        const isHOCCallExpression = (
          node: TSESTree.CallExpression,
        ): boolean => {
          const isCalleeHOC =
            // support for react-redux
            // export default connect(mapStateToProps, mapDispatchToProps)(...)
            (node.callee.type === "CallExpression" &&
              node.callee.callee.type === "Identifier" &&
              node.callee.callee.name === "connect") ||
            // React.memo(...)
            (node.callee.type === "MemberExpression" &&
              node.callee.property.type === "Identifier" &&
              reactHOCs.includes(node.callee.property.name)) ||
            // memo(...)
            (node.callee.type === "Identifier" &&
              reactHOCs.includes(node.callee.name));
          if (!isCalleeHOC) return false;
          if (node.arguments.length === 0) return false;
          const arg = skipTSWrapper(node.arguments[0]);
          switch (arg.type) {
            case "Identifier":
              // memo(Component)
              return true;
            case "FunctionExpression":
              if (!arg.id) return false;
              // memo(function Component() {})
              handleExportIdentifier(arg.id, true);
              return true;
            case "CallExpression":
              // memo(forwardRef(...))
              return isHOCCallExpression(arg);
            default:
              return false;
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
            const isValid = isHOCCallExpression(node);
            if (isValid) {
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
            const declaration = skipTSWrapper(node.declaration);
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
            if (node.declaration) {
              handleExportDeclaration(skipTSWrapper(node.declaration));
            }
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

const skipTSWrapper = <T extends TSESTree.Node>(node: T) => {
  if (node.type === "TSAsExpression" || node.type === "TSSatisfiesExpression") {
    return node.expression;
  }
  return node;
};

type ToString<T> = T extends `${infer V}` ? V : never;
const constantExportExpressions = new Set<
  ToString<TSESTree.Expression["type"]>
>([
  "Literal", // 1, "foo"
  "UnaryExpression", // -1
  "TemplateLiteral", // `Some ${template}`
  "BinaryExpression", // 24 * 60
]);
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
