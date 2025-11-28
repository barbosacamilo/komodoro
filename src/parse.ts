import * as ts from "typescript";

export function parseSource(
  sourceText: string,
  fileName: string
): ts.SourceFile {
  const scriptKind = fileName.endsWith(".ts")
    ? ts.ScriptKind.TS
    : ts.ScriptKind.JS;

  return ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
}
