import * as ts from "typescript";

/**
 * Format a single expression by normalizing spaces around operators.
 *
 * Examples:
 * - "a=b+c/6===4"   -> "a = b + c / 6 === 4"
 * - "!    a"        -> "!a"
 * - "a &&  -b"      -> "a && -b"
 * - "++  a + --b"   -> "++a + --b"
 */
export function formatExpression(
  sourceFile: ts.SourceFile,
  expression: ts.Expression
): string {
  const code = expression.getText(sourceFile).trim();

  let result = "";
  let i = 0;
  let isPrefixUnary = false;

  // Spacing invariant:
  // - We always prepend a single space before operators/tokens when appending to `result`.
  // - Prefix unary operators set `isPrefixUnary = true`, so the next token is attached
  //   directly with no extra space (e.g. `!a`, `++i`, `-x`).
  // - At the end we call `trim()` so the very first leading space is removed.

  const curr = () => code.charAt(i);
  const lookahead = (offset: number) => code.charAt(i + offset);

  function handleBinaryOperator(op: string): void {
    result += ` ${op}`;
    i += op.length;
  }

  function handleUnaryOperator(op: string): void {
    // Intended primarily for prefix unary operators like `!`, `~`, `+`, `-`, `++`, `--`.
    //
    // For single-char ops (`!`, `~`, `+`, `-`), the loop below:
    // - Collapses runs like `!!!a` or `~~foo`
    // - Removes spaces between them
    //
    // For multi-char ops like `++` / `--`, `lookahead(1)` is a single character,
    // so it will never equal `op` and the loop does not collapse repeats.
    // That's acceptable: we don't expect meaningful `++++a` etc.
    result += ` ${op}`;

    while (lookahead(1) === op || lookahead(1) === " ") {
      if (lookahead(1) === op) {
        result += op;
      }
      i++;
    }

    isPrefixUnary = true;
    i += op.length;
  }

  function getPrevNonSpaceChar(): string | undefined {
    let j = i - 1;
    while (j >= 0 && code.charAt(j) === " ") {
      j--;
    }
    if (j < 0) {
      return undefined;
    }
    return code.charAt(j);
  }

  while (i < code.length) {
    switch (curr()) {
      case " ": {
        i++;
        break;
      }

      // TODO: postfix `++` (e.g. a++)
      case "+": {
        if (lookahead(1) === "+") {
          handleUnaryOperator("++");
          break;
        }

        if (lookahead(1) === "=") {
          handleBinaryOperator("+=");
          break;
        }

        // Decide unary vs binary based on the previous non-space character.
        // If there is no previous non-space character (start of expression) or if the
        // previous char is one of these "expression-start" tokens, we treat `+` as
        // prefix unary (`+a`). Otherwise we treat it as binary (`a + b`).
        const prev = getPrevNonSpaceChar();

        if (!prev || "([{=,:?;+-*/%!~&|^<>".includes(prev)) {
          handleUnaryOperator("+");
        } else {
          handleBinaryOperator("+");
        }

        break;
      }

      // TODO: postfix `--` (e.g. a--)
      case "-": {
        if (lookahead(1) === "-") {
          handleUnaryOperator("--");
          break;
        }

        if (lookahead(1) === "=") {
          handleBinaryOperator("-=");
          break;
        }

        const prev = getPrevNonSpaceChar();

        if (!prev || "([{=,:?;+-*/%!~&|^<>".includes(prev)) {
          handleUnaryOperator("-");
        } else {
          handleBinaryOperator("-");
        }

        break;
      }

      case "*": {
        if (lookahead(1) === "=") {
          handleBinaryOperator("*=");
          break;
        }

        if (lookahead(1) === "*") {
          if (lookahead(2) === "=") {
            handleBinaryOperator("**=");
          } else {
            handleBinaryOperator("**");
          }
          break;
        }

        handleBinaryOperator("*");
        break;
      }

      case "/": {
        if (lookahead(1) === "=") {
          handleBinaryOperator("/=");
          break;
        }

        handleBinaryOperator("/");
        break;
      }

      case "%": {
        if (lookahead(1) === "=") {
          handleBinaryOperator("%=");
          break;
        }

        handleBinaryOperator("%");
        break;
      }

      case "=": {
        if (lookahead(1) === "=") {
          if (lookahead(2) === "=") {
            handleBinaryOperator("===");
          } else {
            handleBinaryOperator("==");
          }
          break;
        }

        handleBinaryOperator("=");
        break;
      }

      case "!": {
        if (lookahead(1) === "=") {
          if (lookahead(2) === "=") {
            handleBinaryOperator("!==");
          } else {
            handleBinaryOperator("!=");
          }
          break;
        }

        handleUnaryOperator("!");
        break;
      }

      case ">": {
        if (lookahead(1) === "=") {
          handleBinaryOperator(">=");
          break;
        }

        if (lookahead(1) === ">") {
          if (lookahead(2) === ">") {
            handleBinaryOperator(">>>");
          } else {
            handleBinaryOperator(">>");
          }
          break;
        }

        handleBinaryOperator(">");
        break;
      }

      case "<": {
        if (lookahead(1) === "=") {
          handleBinaryOperator("<=");
          break;
        }

        if (lookahead(1) === "<") {
          handleBinaryOperator("<<");
          break;
        }

        handleBinaryOperator("<");
        break;
      }

      case "&": {
        if (lookahead(1) === "&") {
          handleBinaryOperator("&&");
          break;
        }

        handleBinaryOperator("&");
        break;
      }

      case "|": {
        if (lookahead(1) === "|") {
          handleBinaryOperator("||");
          break;
        }

        handleBinaryOperator("|");
        break;
      }

      case "~": {
        handleUnaryOperator("~");
        break;
      }

      default: {
        // Non-operator token (identifiers, numbers, parentheses, etc.).
        // If we didn't just emit a prefix unary operator, insert a space before it.
        // If we did just emit a prefix unary, attach this token right after (e.g. `!a`, `-x`, `++i`).
        if (!isPrefixUnary) {
          result += " ";
        } else {
          isPrefixUnary = false;
        }

        // Consume characters until we hit an operator or a space.
        while (!"+-*/%=!><&|~ ".includes(curr())) {
          result += curr();
          i++;
        }
      }
    }
  }

  return result.trim();
}
