import { describe, test, expect, beforeEach, afterEach, beforeAll } from "bun:test";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { spyOn } from "bun:test";
import {
  normalizePath,
  fileExists,
  dirExists,
  readFile,
  writeFile,
  readJson,
  writeJson,
  createDir,
  listDir,
} from "./fs.ts";

beforeAll(() => {
  spyOn(console, "log").mockImplementation(() => {});
  spyOn(console, "error").mockImplementation(() => {});
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "acmods-fs-test-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("normalizePath", () => {
  test("expands ~ to homedir", () => {
    expect(normalizePath("~/foo/bar")).toBe(join(homedir(), "foo/bar"));
  });

  test("strips double quotes", () => {
    const result = normalizePath(`"${tmpDir}"`);
    expect(result).toBe(tmpDir);
  });

  test("strips single quotes", () => {
    const result = normalizePath(`'${tmpDir}'`);
    expect(result).toBe(tmpDir);
  });

  test("resolves relative path to absolute", () => {
    const result = normalizePath("some/relative/path");
    expect(result.startsWith("/")).toBe(true);
  });
});

describe("fileExists", () => {
  test("returns true for an existing file", async () => {
    const path = join(tmpDir, "test.txt");
    await writeFile(path, "hello");
    expect(fileExists(path)).toBe(true);
  });

  test("returns false for a non-existent path", () => {
    expect(fileExists(join(tmpDir, "nope.txt"))).toBe(false);
  });

  test("returns true for a directory path (existsSync does not distinguish)", async () => {
    const dir = join(tmpDir, "subdir");
    await createDir(dir);
    expect(fileExists(dir)).toBe(true);
  });
});

describe("dirExists", () => {
  test("returns true for an existing directory", async () => {
    const dir = join(tmpDir, "subdir");
    await createDir(dir);
    expect(dirExists(dir)).toBe(true);
  });

  test("returns false for a non-existent path", () => {
    expect(dirExists(join(tmpDir, "nope"))).toBe(false);
  });

  test("returns false for a file path", async () => {
    const path = join(tmpDir, "file.txt");
    await writeFile(path, "");
    expect(dirExists(path)).toBe(false);
  });
});

describe("readFile / writeFile", () => {
  test("round-trips string content", async () => {
    const path = join(tmpDir, "round-trip.txt");
    const content = "hello\nworld\n";
    await writeFile(path, content);
    expect(await readFile(path)).toBe(content);
  });

  test("writes empty string", async () => {
    const path = join(tmpDir, "empty.txt");
    await writeFile(path, "");
    expect(await readFile(path)).toBe("");
  });
});

describe("readJson / writeJson", () => {
  test("round-trips an object", async () => {
    const path = join(tmpDir, "data.json");
    const data = { foo: "bar", num: 42, nested: { a: true } };
    await writeJson(path, data);
    expect(await readJson<typeof data>(path)).toEqual(data);
  });

  test("output is indented JSON with trailing newline", async () => {
    const path = join(tmpDir, "pretty.json");
    await writeJson(path, { x: 1 });
    const raw = await readFile(path);
    expect(raw).toBe('{\n  "x": 1\n}\n');
  });
});

describe("createDir / listDir", () => {
  test("creates a nested directory", async () => {
    const dir = join(tmpDir, "a", "b", "c");
    await createDir(dir);
    expect(dirExists(dir)).toBe(true);
  });

  test("listDir returns created file names", async () => {
    await writeFile(join(tmpDir, "alpha.txt"), "");
    await writeFile(join(tmpDir, "beta.txt"), "");
    const entries = await listDir(tmpDir);
    expect(entries).toContain("alpha.txt");
    expect(entries).toContain("beta.txt");
  });
});
