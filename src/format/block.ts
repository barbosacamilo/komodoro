import * as ts from "typescript";
import { formatStatement } from "./statement.js";

const INDENT = "  ";

function indent(level: number): string {
  return INDENT.repeat(level);
}

export function formatBlock(
  src: ts.SourceFile,
  block: ts.Block,
  opts?: { level?: number }
): string {
  const level = opts?.level ?? 0;

  const blockIndent = indent(level);
  const statementIndent = indent(level + 1);

  const lines: string[] = [];

  for (const stmt of block.statements) {
    const text = formatStatement(src, stmt, { level: level + 1 });
    lines.push(statementIndent + text);
  }

  return `{\n${lines.join("\n")}\n${blockIndent}}`;
}
