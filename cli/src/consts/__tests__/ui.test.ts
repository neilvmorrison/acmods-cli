import { describe, test, expect } from "bun:test";
import { defaultUiTrack } from "../ui.ts";

describe("defaultUiTrack", () => {
  test("sets name to the provided argument", () => {
    expect(defaultUiTrack("monza").name).toBe("monza");
  });

  test("tags include 'circuit', 'mod', and the name", () => {
    const { tags } = defaultUiTrack("brands-hatch");
    expect(tags).toContain("circuit");
    expect(tags).toContain("mod");
    expect(tags).toContain("brands-hatch");
  });

  test("geotags defaults to empty array", () => {
    expect(defaultUiTrack("spa").geotags).toEqual([]);
  });

  test("pitboxes defaults to '0'", () => {
    expect(defaultUiTrack("nurburgring").pitboxes).toBe("0");
  });

  test("run defaults to 'clockwise'", () => {
    expect(defaultUiTrack("silverstone").run).toBe("clockwise");
  });

  test("description defaults to empty string", () => {
    expect(defaultUiTrack("imola").description).toBe("");
  });

  test("all required UiTrack keys are present", () => {
    const keys = [
      "name",
      "description",
      "tags",
      "geotags",
      "country",
      "city",
      "length",
      "width",
      "pitboxes",
      "run",
    ];
    const result = defaultUiTrack("test-track");
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  test("different names produce independent tag arrays", () => {
    const a = defaultUiTrack("track-a");
    const b = defaultUiTrack("track-b");
    expect(a.tags).not.toEqual(b.tags);
  });
});
