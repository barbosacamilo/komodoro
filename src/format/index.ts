import * as ts from "typescript";
import { parseSource } from "../parse";
import { formatFunction } from "./function";

export function formatSource(sourceText: string, fileName: string): string {
  const ast = parseSource(sourceText, fileName);
  const parts: string[] = [];

  ast.forEachChild((node) => {
    if (ts.isFunctionDeclaration(node)) {
      parts.push(formatFunction(ast, node));
    } else {
      parts.push(node.getText(ast));
    }
  });

  return parts.join("\n\n");
}
