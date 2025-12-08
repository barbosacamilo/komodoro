import { describe, expect, it } from "vitest";
import * as ts from "typescript";
import { formatExpression } from "../src/format/expression";

function createExpression(text: string): {
  src: ts.SourceFile;
  expression: ts.Expression;
} {
  const src = ts.createSourceFile(
    "test.ts",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const stmt = src.statements[0];

  if (!stmt || !ts.isExpressionStatement(stmt)) {
    throw new Error("Expected a top-level expression statement");
  }

  return { src, expression: stmt.expression };
}

describe("formatExpression", () => {
  it("adds spaces around + and other binary operators in a simple expression", () => {
    const inputExpression = "a=b+c/6===4";
    const { src, expression } = createExpression(inputExpression);
    const formatted = formatExpression(src, expression);
    const expected = "a = b + c / 6 === 4";
    expect(formatted).toBe(expected);
  });

  it("removes spaces between `!` and its operand (e.g. `!    a` -> `!a`)", () => {
    const inputExpression = "!    a";
    const expectedExpression = "!a";
    const { src, expression } = createExpression(inputExpression);
    const formattedExpression = formatExpression(src, expression);
    expect(formattedExpression).toBe(expectedExpression);
  });

  it("removes spaces between consecutive `!` and its operand (e.g. `! !!!  a` -> `!!!!a`)", () => {
    const inputExpression = "! !!!  a";
    const expectedExpression = "!!!!a";
    const { src, expression } = createExpression(inputExpression);
    const formattedExpression = formatExpression(src, expression);
    expect(formattedExpression).toBe(expectedExpression);
  });

  it("handles prefix unary operator `++` (e.g. `a+ ++    b` -> `a + ++b`)", () => {
    const input = "a+ ++  b";
    const expected = "a + ++b";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("handles prefix unary operator `~` (e.g. `a+ ~b` -> `a + ~b`)", () => {
    const input = "a+ ~b";
    const expected = "a + ~b";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("treats leading `+` as unary and `+` in the middle as binary", () => {
    const input = "+a+-b";
    const expected = "+a + -b";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("treats leading `-` as unary and `-` in the middle as binary/unary as needed", () => {
    const input = "-a- -b";
    const expected = "-a - -b";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("handles unary - after a binary operator (e.g. `a&&-b` -> `a && -b`)", () => {
    const input = "a&&-b";
    const expected = "a && -b";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("handles combined prefix ++ and -- with a binary + between them", () => {
    const input = "++a+--b";
    const expected = "++a + --b";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("formats equality and strict-equality operators", () => {
    const input = "a==b!=c===d!==e";
    const expected = "a == b != c === d !== e";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("formats relational and shift operators", () => {
    const input = "a>b>=c<d<=e>>f>>>g<<h";
    const expected = "a > b >= c < d <= e >> f >>> g << h";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("formats logical and bitwise and/or operators", () => {
    const input = "a&&b||c&d|e";
    const expected = "a && b || c & d | e";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("handles consecutive bitwise not operators `~` (e.g. `a+~~b` -> `a + ~~b`)", () => {
    const input = "a+~~b";
    const expected = "a + ~~b";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });

  it("normalizes extra spaces around multiple different operators", () => {
    const input = "  a   &&   -b  ||  ++c  *  d ";
    const expected = "a && -b || ++c * d";
    const { src, expression } = createExpression(input);
    const formatted = formatExpression(src, expression);
    expect(formatted).toBe(expected);
  });
});
