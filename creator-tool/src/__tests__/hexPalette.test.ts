import { describe, expect, it } from "vitest";

import { normalizeHexToken, parseHexPalette } from "../lib/hexPalette";

describe("normalizeHexToken", () => {
  it("normalizes 3-digit shorthand", () => {
    expect(normalizeHexToken("ABC")).toBe("#AABBCC");
  });

  it("normalizes 6-digit hex with hash", () => {
    expect(normalizeHexToken("#12af0C")).toBe("#12AF0C");
  });

  it("throws for invalid tokens", () => {
    expect(() => normalizeHexToken("GGG")).toThrow("Invalid hex color token");
  });
});

describe("parseHexPalette", () => {
  it("parses newline and comma separated values", () => {
    const palette = parseHexPalette("FF0000\n00FF00,0000FF", "rgb");

    expect(palette.name).toBe("rgb");
    expect(palette.colors).toEqual(["#FF0000", "#00FF00", "#0000FF"]);
  });

  it("ignores comments and blank lines", () => {
    const content = `
      // test palette
      FF0000 ; comment

      00FF00
    `;

    const palette = parseHexPalette(content, "clean");

    expect(palette.colors).toEqual(["#FF0000", "#00FF00"]);
  });
});
