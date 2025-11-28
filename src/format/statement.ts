import * as ts from "typescript";
import { formatFunction } from "./function";

function ensureSemicolon(text: string): string {
  if (text.endsWith(";")) {
    return text;
  }

  return text + ";";
}

function formatBinaryOperators(text: string): string {
  // NOTE: This will break ==, +=, etc. For now this works.
  return text.replace(/\s*([=+\-*/])\s*/g, " $1 ");
}

export function formatStatement(
  src: ts.SourceFile,
  stmt: ts.Statement,
  opts?: { level?: number }
): string {
  const level = opts?.level ?? 0;

  switch (stmt.kind) {
    case ts.SyntaxKind.FunctionDeclaration: {
      const fn = stmt as ts.FunctionDeclaration;
      return formatFunction(src, fn, { level });
    }

    case ts.SyntaxKind.VariableStatement:
    case ts.SyntaxKind.ExpressionStatement:
    case ts.SyntaxKind.ReturnStatement: {
      const raw = stmt.getText(src);
      return ensureSemicolon(formatBinaryOperators(raw));
    }

    default: {
      return stmt.getText(src);
    }
  }
}
