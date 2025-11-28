import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import { formatBlock } from "../src/format/block";

function makeBlockFromBody(body: string): {
  src: ts.SourceFile;
  block: ts.Block;
} {
  const sourceText = `function test() ${body}`;
  const src = ts.createSourceFile(
    "test.ts",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const fn = src.statements.find(ts.isFunctionDeclaration);
  if (!fn || !fn.body) {
    throw new Error("No function body found in test code");
  }

  return { src, block: fn.body };
}

describe("formatBlock", () => {
  it("adds indentation, operator spaces and semicolons", () => {
    const inputBody = `{
  const num1=1
  const num2=2
  return num1+num2
}`;

    const { src, block } = makeBlockFromBody(inputBody);
    const formatted = formatBlock(src, block);

    const expected = `{
  const num1 = 1;
  const num2 = 2;
  return num1 + num2;
}`;

    expect(formatted).toBe(expected);
  });

  it("adds semicolons at end of each statement", () => {
    const inputBody = `{
  const a = 1
  const b = 2
}`;

    const { src, block } = makeBlockFromBody(inputBody);
    const formatted = formatBlock(src, block);

    const expected = `{
  const a = 1;
  const b = 2;
}`;

    expect(formatted).toBe(expected);
  });

  it("Add lines between each statement", () => {
    const inputBody = `{
  const a = 1;
  const b = 2;
}`;

    const { src, block } = makeBlockFromBody(inputBody);
    const formatted = formatBlock(src, block);

    const expected = `{
  const a = 1;
  const b = 2;
}`;

    expect(formatted).toBe(expected);
  });

  it("Apply the correct indentation to nested blocks", () => {
    const inputBody = `{
  function f() {
  const a="a"
  const b = "b";
  }
}`;

    const { src, block } = makeBlockFromBody(inputBody);
    const formatted = formatBlock(src, block);

    const expected = `{
  function f() {
    const a = "a";
    const b = "b";
  }
}`;

    expect(formatted).toBe(expected);
  });

  it("Put the { always next to the declaration block", () => {
    const inputBody = `{
  function f()
{
  const a="a"
  const b = "b";
}
}`;

    const { src, block } = makeBlockFromBody(inputBody);
    const formatted = formatBlock(src, block);

    const expected = `{
  function f() {
    const a = "a";
    const b = "b";
  }
}`;

    expect(formatted).toBe(expected);
  });
});
