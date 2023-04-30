import { TSESLint } from "@typescript-eslint/utils";
import { TSESTree } from "@typescript-eslint/types";

const possibleReactExportRE = /^[A-Z][a-zA-Z0-9]*$/;
// Starts with uppercase and at least one lowercase
// This can lead to some false positive (ex: `const CMS = () => <></>; export default CMS`)
// But allow to catch `export const CONSTANT = 3`
// and the false positive can be avoided with direct name export
const strictReactExportRE = /^[A-Z][a-zA-Z0-9]*[a-z]+[a-zA-Z0-9]*$/;

export const onlyExportComponents: TSESLint.RuleModule<
  | "exportAll"
  | "namedExport"
  | "anonymousExport"
  | "noExport"
  | "localComponents",
  [] | [{ allowConstantExport?: boolean; checkJS?: boolean }]
> = {
  meta: {
    messages: {
      exportAll:
        "This rule can't verify that `export *` only export components",
      namedExport:
        "Fast refresh only works when a file only export components. Use a new file to share constant or functions between components.",
      anonymousExport:
        "Fast refresh can't handle anonymous component. Add a name to your export.",
      localComponents:
        "Fast refresh only works when a file only export components. Move your component(s) to a separate file.",
      noExport:
        "Fast refresh only works when a file has exports. Move your component(s) to a separate file.",
    },
    type: "problem",
    schema: [
      {
        type: "object",
        properties: {
          allowConstantExport: { type: "boolean" },
          checkJS: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: (context) => {
    const { allowConstantExport = false, checkJS = false } =
      context.options[0] || {};
    const filename = context.getFilename();
    // Skip tests & stories files
    if (
      filename.includes(".test.") ||
      filename.includes(".spec.") ||
      filename.includes(".stories.")
    ) {
      return {};
    }
    const shouldScan =
      filename.endsWith(".jsx") ||
      filename.endsWith(".tsx") ||
      (checkJS && filename.endsWith(".js"));
    if (!shouldScan) return {};

    return {
      Program(program) {
        let hasExports = false;
        let mayHaveReactExport = false;
        let reactIsInScope = false;
        const localComponents: TSESTree.Identifier[] = [];
        const nonComponentExports: TSESTree.BindingName[] = [];

        const handleLocalIdentifier = (
          identifierNode: TSESTree.BindingName,
        ) => {
          if (identifierNode.type !== "Identifier") return;
          if (possibleReactExportRE.test(identifierNode.name)) {
            localComponents.push(identifierNode);
          }
        };

        const handleExportIdentifier = (
          identifierNode: TSESTree.BindingName,
          isFunction?: boolean,
          init?: TSESTree.Expression | null,
        ) => {
          if (identifierNode.type !== "Identifier") {
            nonComponentExports.push(identifierNode);
            return;
          }
          if (
            !mayHaveReactExport &&
            possibleReactExportRE.test(identifierNode.name)
          ) {
            mayHaveReactExport = true;
          }
          if (
            allowConstantExport &&
            init &&
            (init.type === "Literal" ||
              init.type === "TemplateLiteral" ||
              init.type === "BinaryExpression")
          ) {
            return;
          }
          if (
            !(isFunction ? possibleReactExportRE : strictReactExportRE).test(
              identifierNode.name,
            )
          ) {
            nonComponentExports.push(identifierNode);
          }
        };

        const handleExportDeclaration = (node: TSESTree.ExportDeclaration) => {
          if (node.type === "VariableDeclaration") {
            for (const variable of node.declarations) {
              handleExportIdentifier(
                variable.id,
                variable.init?.type === "ArrowFunctionExpression",
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
            context.report({ messageId: "anonymousExport", node });
          }
        };

        for (const node of program.body) {
          if (node.type === "ExportAllDeclaration") {
            hasExports = true;
            context.report({ messageId: "exportAll", node });
          } else if (node.type === "ExportDefaultDeclaration") {
            hasExports = true;
            if (
              node.declaration.type === "VariableDeclaration" ||
              node.declaration.type === "FunctionDeclaration" ||
              node.declaration.type === "CallExpression"
            ) {
              handleExportDeclaration(node.declaration);
            }
            if (node.declaration.type === "Identifier") {
              handleExportIdentifier(node.declaration);
            }
            if (
              node.declaration.type === "ArrowFunctionExpression" &&
              !node.declaration.id
            ) {
              context.report({ messageId: "anonymousExport", node });
            }
          } else if (node.type === "ExportNamedDeclaration") {
            hasExports = true;
            if (node.declaration) handleExportDeclaration(node.declaration);
            for (const specifier of node.specifiers) {
              handleExportIdentifier(specifier.exported);
            }
          } else if (node.type === "VariableDeclaration") {
            for (const variable of node.declarations) {
              handleLocalIdentifier(variable.id);
            }
          } else if (node.type === "FunctionDeclaration") {
            handleLocalIdentifier(node.id);
          } else if (node.type === "ImportDeclaration") {
            if (node.source.value === "react") {
              reactIsInScope = true;
            }
          }
        }

        if (checkJS && !reactIsInScope) return;

        if (hasExports) {
          if (mayHaveReactExport) {
            for (const node of nonComponentExports) {
              context.report({ messageId: "namedExport", node });
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
