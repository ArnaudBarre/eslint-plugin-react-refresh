import { TSESLint } from "@typescript-eslint/experimental-utils";
import { TSESTree } from "@typescript-eslint/types";
import { ExportDeclaration } from "@typescript-eslint/types/dist/ast-spec";

export const rule: TSESLint.RuleModule<
  "exportAll" | "namedExport" | "anonymousExport"
> = {
  meta: {
    messages: {
      exportAll:
        "This rule can't verify that `export *` only export components",
      namedExport:
        "Fast refresh only works when a file only export components. Use a new file to share constant or functions between components.",
      anonymousExport:
        "Fast refresh can't handle anonymous component. Add a name to your export.",
    },
    type: "problem",
    schema: [],
  },
  create: (context) => {
    if (!context.getFilename().endsWith("x")) return {};

    return {
      Program(program) {
        let mayHaveReactExport = false;
        const nonComponentExport: TSESTree.BindingName[] = [];

        const handleIdentifier = (identifierNode: TSESTree.BindingName) => {
          if (identifierNode.type !== "Identifier") {
            nonComponentExport.push(identifierNode);
            return;
          }
          if (/^[A-Z][a-zA-Z]*$/.test(identifierNode.name)) {
            mayHaveReactExport = true;
          }
          // Only letters, starts with uppercase and at least one lowercase
          // This can lead to some false positive (ex: `const CMS = () => <></>`)
          // But allow to catch `export const CONSTANT = 3`
          if (!/^[A-Z][a-zA-Z]*[a-z]+[a-zA-Z]*$/.test(identifierNode.name)) {
            nonComponentExport.push(identifierNode);
          }
        };

        const handleExportDeclaration = (node: ExportDeclaration) => {
          if (node.type === "VariableDeclaration") {
            for (const variable of node.declarations) {
              handleIdentifier(variable.id);
            }
          } else if (node.type === "FunctionDeclaration") {
            if (node.id === null) {
              context.report({ messageId: "anonymousExport", node });
            } else {
              handleIdentifier(node.id);
            }
          }
        };

        for (const node of program.body) {
          if (node.type === "ExportAllDeclaration") {
            context.report({ messageId: "exportAll", node });
          } else if (node.type === "ExportDefaultDeclaration") {
            if (
              node.declaration.type === "VariableDeclaration" ||
              node.declaration.type === "FunctionDeclaration"
            ) {
              handleExportDeclaration(node.declaration);
            }
            if (
              node.declaration.type === "ArrowFunctionExpression" &&
              !node.declaration.id
            ) {
              context.report({ messageId: "anonymousExport", node });
            }
          } else if (node.type === "ExportNamedDeclaration") {
            if (node.declaration) handleExportDeclaration(node.declaration);
            for (const specifier of node.specifiers) {
              handleIdentifier(specifier.exported);
            }
          }
        }

        if (!mayHaveReactExport) return;

        for (const node of nonComponentExport) {
          context.report({ messageId: "namedExport", node });
        }
      },
    };
  },
};
