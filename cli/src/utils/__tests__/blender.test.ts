import { describe, test, expect } from "bun:test";
import { findBlenderBinary } from "../blender.ts";

describe("findBlenderBinary", () => {
  test("returns a string or null without throwing", () => {
    const result = findBlenderBinary();
    expect(result === null || typeof result === "string").toBe(true);
  });

  test("if a path is returned, it is non-empty", () => {
    const result = findBlenderBinary();
    if (result !== null) {
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
