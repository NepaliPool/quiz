import { describe, expect, test } from "bun:test";

import { normalizeMathPaste } from "./parse-pasted-questions";

describe("normalizeMathPaste", () => {
  test("collapses OCR digit-duplication around \\frac{n}{m}", () => {
    // Captured paste shape: numerator/denominator digits mirrored before and
    // after the frac command, e.g. 12\frac{1}{2}21 instead of \frac{1}{2}.
    const input = "12\\frac{1}{2}21";
    expect(normalizeMathPaste(input)).toBe("$\\frac{1}{2}$");
  });

  test("leaves a normal \\frac alone", () => {
    expect(normalizeMathPaste("\\frac{1}{2}")).toBe("$\\frac{1}{2}$");
  });

  test("normalizes comma + space before dx", () => {
    expect(normalizeMathPaste("\\int f(x), dx")).toBe("$\\int f(x)\\,dx$");
  });
});
