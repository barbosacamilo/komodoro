import * as ts from "typescript";
import { formatBlock } from "./block";

export function formatFunctionParam(
  src: ts.SourceFile,
  param: ts.ParameterDeclaration
): string {
  const name = param.name.getText(src);
  const type = param.type?.getText(src);

  return type ? `${name}: ${type}` : name;
}

export function formatFunctionParams(
  src: ts.SourceFile,
  params: ts.NodeArray<ts.ParameterDeclaration>
): string {
  const parts: string[] = [];

  for (const p of params) {
    parts.push(formatFunctionParam(src, p));
  }

  return parts.join(", ");
}

export function formatFunctionSignature(
  src: ts.SourceFile,
  fn: ts.FunctionDeclaration
): string {
  const name = fn.name?.getText(src) ?? "";
  const params = formatFunctionParams(src, fn.parameters);
  const type = fn.type?.getText(src);

  let signature = `function ${name}(${params})`;
  if (type) {
    signature += `: ${type}`;
  }

  return signature;
}

export function formatFunction(
  src: ts.SourceFile,
  fn: ts.FunctionDeclaration,
  opts?: { level?: number }
): string {
  const level = opts?.level ?? 0;

  const signature = formatFunctionSignature(src, fn);

  if (!fn.body) {
    return `${signature} {}`;
  }

  const body = formatBlock(src, fn.body, { level });

  return `${signature} ${body}`;
}
