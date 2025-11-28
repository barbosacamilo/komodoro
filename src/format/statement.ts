import * as ts from "typescript";
import { formatFunction } from "./function";

function ensureSemicolon(text: string): string {
  if (text.endsWith(";")) {
    return text;
  }

  return text + ";";
}

function formatBinaryOperators(text: string): string {
  // NOTE: This will break ==, +=, etc. For now it's just a first pass.
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
      // Let formatFunction handle its own body using this `level`
      // (used by its internal formatBlock).
      return formatFunction(src, fn, { level });
    }

    // You could later add:
    // case ts.SyntaxKind.ClassDeclaration:
    //   return formatClassDeclaration(...);

    // --- Simple terminated statements ------------------------------------
    case ts.SyntaxKind.VariableStatement:
    case ts.SyntaxKind.ExpressionStatement:
    case ts.SyntaxKind.ReturnStatement: {
      const raw = stmt.getText(src);
      return ensureSemicolon(formatBinaryOperators(raw));
    }

    // --- Everything else (if/for/while/try/etc.) -------------------------
    default: {
      // For now, just keep their original text.
      // Later you can add specific cases for IfStatement, ForStatement, etc.
      return stmt.getText(src);
    }
  }
}
