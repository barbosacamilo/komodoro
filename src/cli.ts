#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { formatSource } from "./format";

function main(fileName?: string) {
  if (!fileName) {
    fileName = process.argv[2];
  }

  if (!fileName) {
    console.error("Usage: tiny-ts-fmt <file>");
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), fileName);
  const sourceText = fs.readFileSync(absPath, "utf8");

  const formatted = formatSource(sourceText, fileName);
  process.stdout.write(formatted);
}

main("./index.ts");
