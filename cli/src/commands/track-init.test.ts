import { describe, test, expect, beforeEach, afterEach, beforeAll, mock } from "bun:test";
import { spyOn } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { scaffoldTrack } from "./track-init.ts";
import { defaultUiTrack } from "../consts/ui.ts";
import { fileExists, dirExists, readJson } from "../utils/fs.ts";

beforeAll(() => {
  spyOn(console, "log").mockImplementation(() => {});
  spyOn(console, "error").mockImplementation(() => {});
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "acmods-scaffold-test-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("scaffoldTrack", () => {
  const name = "test-track";

  test("creates the track root directory", async () => {
    await scaffoldTrack(name, tmpDir, defaultUiTrack(name), false);
    expect(dirExists(join(tmpDir, name))).toBe(true);
  });

  test("creates ai/, data/, and ui/ subdirectories", async () => {
    await scaffoldTrack(name, tmpDir, defaultUiTrack(name), false);
    expect(dirExists(join(tmpDir, name, "ai"))).toBe(true);
    expect(dirExists(join(tmpDir, name, "data"))).toBe(true);
    expect(dirExists(join(tmpDir, name, "ui"))).toBe(true);
  });

  test("creates placeholder .kn5 file", async () => {
    await scaffoldTrack(name, tmpDir, defaultUiTrack(name), false);
    expect(fileExists(join(tmpDir, name, `${name}.kn5`))).toBe(true);
  });

  test("creates ai placeholder files", async () => {
    await scaffoldTrack(name, tmpDir, defaultUiTrack(name), false);
    expect(fileExists(join(tmpDir, name, "ai", "fast_lane.ai"))).toBe(true);
    expect(fileExists(join(tmpDir, name, "ai", "pit_lane.ai"))).toBe(true);
  });

  test("creates ui placeholder images", async () => {
    await scaffoldTrack(name, tmpDir, defaultUiTrack(name), false);
    expect(fileExists(join(tmpDir, name, "ui", "outline.png"))).toBe(true);
    expect(fileExists(join(tmpDir, name, "ui", "preview.png"))).toBe(true);
  });

  test("creates all 6 INI files in data/", async () => {
    await scaffoldTrack(name, tmpDir, defaultUiTrack(name), false);
    const iniFiles = [
      "audio_sources.ini",
      "cameras.ini",
      "crew.ini",
      "groove.ini",
      "lighting.ini",
      "surfaces.ini",
    ];
    for (const file of iniFiles) {
      expect(fileExists(join(tmpDir, name, "data", file))).toBe(true);
    }
  });

  test("writes ui_track.json with the provided metadata", async () => {
    const metadata = defaultUiTrack(name);
    await scaffoldTrack(name, tmpDir, metadata, false);
    const written = await readJson(join(tmpDir, name, "ui", "ui_track.json"));
    expect(written).toEqual(metadata);
  });

  test("does not create .gitattributes or .gitignore when initGit=false", async () => {
    await scaffoldTrack(name, tmpDir, defaultUiTrack(name), false);
    expect(fileExists(join(tmpDir, name, ".gitattributes"))).toBe(false);
    expect(fileExists(join(tmpDir, name, ".gitignore"))).toBe(false);
  });

  test("creates .gitattributes and .gitignore when initGit=true", async () => {
    // Mock git subprocess to prevent actual git calls
    const spawnSpy = spyOn(Bun, "spawnSync").mockImplementation(() => ({
      exitCode: 0,
      stdout: Buffer.from(""),
      stderr: Buffer.from(""),
      success: true,
    } as ReturnType<typeof Bun.spawnSync>));

    await scaffoldTrack(name, tmpDir, defaultUiTrack(name), true);

    expect(fileExists(join(tmpDir, name, ".gitattributes"))).toBe(true);
    expect(fileExists(join(tmpDir, name, ".gitignore"))).toBe(true);

    spawnSpy.mockRestore();
  });

  test("exits with error when track directory already exists", async () => {
    await scaffoldTrack(name, tmpDir, defaultUiTrack(name), false);

    const exitSpy = spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    await expect(
      scaffoldTrack(name, tmpDir, defaultUiTrack(name), false)
    ).rejects.toThrow("process.exit called");

    exitSpy.mockRestore();
  });
});
