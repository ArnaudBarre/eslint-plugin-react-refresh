import type { TSESLint } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/types";

const reactComponentNameRE = /^[A-Z][a-zA-Z0-9_]*$/u;

export type Options = {
  allowExportNames?: string[];
  allowConstantExport?: boolean;
  customHOCs?: string[];
  checkJS?: boolean;
};

export const onlyExportComponents: TSESLint.RuleModule<
  | "exportAll"
  | "namedExport"
  | "anonymousExport"
  | "noExport"
  | "localComponents"
  | "reactContext",
  [] | [Options]
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
      filename.includes(".test.")
      || filename.includes(".spec.")
      || filename.includes(".cy.")
      || filename.includes(".stories.")
    ) {
      return {};
    }
    const shouldScan =
      filename.endsWith(".jsx")
      || filename.endsWith(".tsx")
      || (checkJS && filename.endsWith(".js"));
    if (!shouldScan) return {};

    const allowExportNamesSet = allowExportNames
      ? new Set(allowExportNames)
      : undefined;

    const reactHOCs = ["memo", "forwardRef", "lazy", ...customHOCs];
    const getHocName = (node: TSESTree.CallExpression): string | undefined => {
      // react-redux: connect(mapStateToProps, mapDispatchToProps)(...)
      // TanStack: createRootRoute()({ component: Foo });
      if (
        node.callee.type === "CallExpression"
        && node.callee.callee.type === "Identifier"
      ) {
        return getHocName(node.callee);
      }
      // React.memo(...)
      if (
        node.callee.type === "MemberExpression"
        && node.callee.property.type === "Identifier"
      ) {
        return node.callee.property.name;
      }
      // memo(...)
      if (node.callee.type === "Identifier") {
        return node.callee.name;
      }
      return undefined;
    };

    const isCallExpressionReactComponent = (
      node: TSESTree.CallExpression,
    ): boolean | "needName" => {
      const hocName = getHocName(node);
      if (!hocName) return false;
      if (!reactHOCs.includes(hocName)) return false;
      const validateArgument = hocName === "memo" || hocName === "forwardRef";
      if (!validateArgument) return true;
      if (node.arguments.length === 0) return false;
      const arg = skipTSWrapper(node.arguments[0]);
      switch (arg.type) {
        case "Identifier":
          // memo(Component)
          return reactComponentNameRE.test(arg.name);
        case "FunctionExpression":
        case "ArrowFunctionExpression":
          if (!arg.id) return "needName";
          // memo(function Component() {})
          return reactComponentNameRE.test(arg.id.name);
        case "CallExpression":
          // memo(forwardRef(...))
          return isCallExpressionReactComponent(arg);
        default:
          return false;
      }
    };

    const isExpressionReactComponent = (
      expressionParam: TSESTree.Expression,
    ): boolean | "needName" => {
      const exp = skipTSWrapper(expressionParam);
      if (
        exp.type === "ArrowFunctionExpression"
        || exp.type === "FunctionExpression"
      ) {
        if (exp.params.length > 2) return false;
        if (!exp.id?.name) return "needName";
        return reactComponentNameRE.test(exp.id.name);
      }
      if (exp.type === "ConditionalExpression") {
        const consequent = isExpressionReactComponent(exp.consequent);
        const alternate = isExpressionReactComponent(exp.alternate);
        if (consequent === false || alternate === false) return false;
        if (consequent === "needName" || alternate === "needName") {
          return "needName";
        }
        return true;
      }
      if (exp.type === "CallExpression") {
        return isCallExpressionReactComponent(exp);
      }
      // Support styled-components
      if (exp.type === "TaggedTemplateExpression") return "needName";
      return false;
    };

    return {
      Program(program) {
        let hasExports = false;
        let hasReactExport = false;
        let reactIsInScope = false;
        const localComponents: TSESTree.Identifier[] = [];
        const nonComponentExports: TSESTree.ExportDeclaration[] = [];
        const reactContextExports: TSESTree.Identifier[] = [];

        const handleExportIdentifier = (
          identifierNode: TSESTree.BindingName | TSESTree.StringLiteral,
          initParam?: TSESTree.Expression,
        ) => {
          if (identifierNode.type !== "Identifier") {
            nonComponentExports.push(identifierNode);
            return;
          }
          if (allowExportNamesSet?.has(identifierNode.name)) return;

          if (!initParam) {
            if (reactComponentNameRE.test(identifierNode.name)) {
              hasReactExport = true;
            } else {
              nonComponentExports.push(identifierNode);
            }
            return;
          }

          const init = skipTSWrapper(initParam);
          if (allowConstantExport && constantExportExpressions.has(init.type)) {
            return;
          }

          if (
            init.type === "CallExpression"
            // createContext || React.createContext
            && ((init.callee.type === "Identifier"
              && init.callee.name === "createContext")
              || (init.callee.type === "MemberExpression"
                && init.callee.property.type === "Identifier"
                && init.callee.property.name === "createContext"))
          ) {
            reactContextExports.push(identifierNode);
            return;
          }

          const isReactComponent =
            reactComponentNameRE.test(identifierNode.name)
            && isExpressionReactComponent(init);

          if (isReactComponent === false) {
            nonComponentExports.push(identifierNode);
          } else {
            hasReactExport = true;
          }
        };

        const handleExportDeclaration = (node: TSESTree.ExportDeclaration) => {
          if (node.type === "VariableDeclaration") {
            for (const variable of node.declarations) {
              if (variable.init === null) {
                nonComponentExports.push(variable.id);
                continue;
              }
              handleExportIdentifier(variable.id, variable.init);
            }
          } else if (node.type === "FunctionDeclaration") {
            if (node.id === null) {
              context.report({ messageId: "anonymousExport", node });
            } else {
              handleExportIdentifier(node.id);
            }
          } else if (node.type === "CallExpression") {
            const result = isCallExpressionReactComponent(node);
            if (result === false) {
              nonComponentExports.push(node);
            } else if (result === "needName") {
              context.report({ messageId: "anonymousExport", node });
            } else {
              hasReactExport = true;
            }
          } else {
            nonComponentExports.push(node);
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
              declaration.type === "VariableDeclaration"
              || declaration.type === "FunctionDeclaration"
              || declaration.type === "CallExpression"
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
                specifier.exported.type === "Identifier"
                  && specifier.exported.name === "default"
                  ? specifier.local
                  : specifier.exported,
              );
            }
          } else if (node.type === "VariableDeclaration") {
            for (const variable of node.declarations) {
              if (
                variable.id.type === "Identifier"
                && reactComponentNameRE.test(variable.id.name)
                && variable.init !== null
                && isExpressionReactComponent(variable.init) !== false
              ) {
                localComponents.push(variable.id);
              }
            }
          } else if (node.type === "FunctionDeclaration") {
            if (reactComponentNameRE.test(node.id.name)) {
              localComponents.push(node.id);
            }
          } else if (
            node.type === "ImportDeclaration"
            && node.source.value === "react"
          ) {
            reactIsInScope = true;
          }
        }

        if (checkJS && !reactIsInScope) return;

        if (hasExports) {
          // tsl-ignore core/noUnnecessaryCondition
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
  if (
    node.type === "TSAsExpression"
    || node.type === "TSSatisfiesExpression"
    || node.type === "TSNonNullExpression"
    || node.type === "TSTypeAssertion"
    || node.type === "TSInstantiationExpression"
  ) {
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
