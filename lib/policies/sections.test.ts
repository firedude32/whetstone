import { describe, it, expect } from "vitest";
import { parseSections } from "./sections";

describe("parseSections", () => {
  it("splits on ## headings and trims", () => {
    const s = parseSections("intro ignored\n## A\n\nalpha\n\n## B\nbeta\n");
    expect(s).toEqual({ A: "alpha", B: "beta" });
  });

  it("keeps ### subheadings inside their section", () => {
    expect(parseSections("## A\n### sub\ntext").A).toBe("### sub\ntext");
  });

  it("handles Windows line endings", () => {
    expect(parseSections("## A\r\nalpha\r\n")).toEqual({ A: "alpha" });
  });

  it("throws on duplicate headings", () => {
    expect(() => parseSections("## A\nx\n## A\ny")).toThrow(/duplicate/);
  });
});
