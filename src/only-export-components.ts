import { TSESLint } from "@typescript-eslint/utils";
import { TSESTree } from "@typescript-eslint/types";

const possibleReactExportRE = /^[A-Z][a-zA-Z0-9]*$/;
// Starts with uppercase and at least one lowercase
// This can lead to some false positive (ex: `const CMS = () => <></>`)
// But allow to catch `export const CONSTANT = 3`
const strictReactExportRE = /^[A-Z][a-zA-Z0-9]*[a-z]+[a-zA-Z0-9]*$/;


export const onlyExportComponents: TSESLint.RuleModule<
  | "exportAll"
  | "namedExport"
  | "anonymousExport"
  | "noExport"
  | "localComponents"
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
          "type": "object",
          "properties": {
              "limitParsedFilesToPreventFalsePositives": {
                  "type": "boolean"
              }
          },
          "additionalProperties": false
      }
  ]
  },
  create: (context) => {
    const config = context.options[0] || { limitParsedFilesToPreventFalsePositives: true };
    const { limitParsedFilesToPreventFalsePositives } = config;
    const filename = context.getFilename();
    if (
      limitParsedFilesToPreventFalsePositives && (
      !filename.endsWith("x") ||
      filename.includes(".test.") ||
      filename.includes(".spec."))
    ) {
      return {};
    }

    return {
      Program(program) {
        let hasExports = false;
        let mayHaveReactExport = false;
        let reactIsInScope = false;
        const localComponents: TSESTree.Identifier[] = [];
        const nonComponentExport: TSESTree.BindingName[] = [];

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
        ) => {
          if (identifierNode.type !== "Identifier") {
            nonComponentExport.push(identifierNode);
            return;
          }
          if (
            !mayHaveReactExport &&
            possibleReactExportRE.test(identifierNode.name)
          ) {
            mayHaveReactExport = true;
          }
          if (!strictReactExportRE.test(identifierNode.name)) {
            nonComponentExport.push(identifierNode);
          }
        };

        const handleExportDeclaration = (node: TSESTree.ExportDeclaration) => {
          if (node.type === "VariableDeclaration") {
            for (const variable of node.declarations) {
              handleExportIdentifier(variable.id);
            }
          } else if (node.type === "FunctionDeclaration") {
            if (node.id === null) {
              context.report({ messageId: "anonymousExport", node });
            } else {
              handleExportIdentifier(node.id);
            }
          }
        };

        const handleImportDeclaration = (node: TSESTree.ImportDeclaration) => {
          if (node.source.value === 'react') {
            reactIsInScope = true;
          }
        };

        for (const node of program.body) {;
          if (node.type === "ExportAllDeclaration") {
            hasExports = true;
            context.report({ messageId: "exportAll", node });
          } else if (node.type === "ExportDefaultDeclaration") {
            hasExports = true;
            if (
              node.declaration.type === "VariableDeclaration" ||
              node.declaration.type === "FunctionDeclaration"
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
            handleImportDeclaration(node);
          }
        }

        const checkFile = limitParsedFilesToPreventFalsePositives ? true : reactIsInScope;

        if (checkFile) {
          if (hasExports) {
            if (mayHaveReactExport) {
              for (const node of nonComponentExport) {
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
        }
      },
    };
  },
};
