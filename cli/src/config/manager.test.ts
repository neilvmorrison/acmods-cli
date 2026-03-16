import { describe, test, expect, beforeEach, afterEach, beforeAll } from "bun:test";
import { spyOn } from "bun:test";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { getConfigPath, readConfig, writeConfig } from "./manager.ts";
import { writeJson } from "../utils/fs.ts";

beforeAll(() => {
  spyOn(console, "log").mockImplementation(() => {});
  spyOn(console, "error").mockImplementation(() => {});
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "acmods-config-test-"));
  delete process.env.ACMODS_CONFIG;
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
  delete process.env.ACMODS_CONFIG;
});

describe("getConfigPath", () => {
  test("returns default path when no env or override", () => {
    const result = getConfigPath();
    expect(result).toBe(join(homedir(), ".config", "acmods", "config.json"));
  });

  test("returns override arg when provided", () => {
    const override = join(tmpDir, "my-config.json");
    expect(getConfigPath(override)).toBe(override);
  });

  test("returns ACMODS_CONFIG env var when set", () => {
    const envPath = join(tmpDir, "env-config.json");
    process.env.ACMODS_CONFIG = envPath;
    expect(getConfigPath()).toBe(envPath);
  });

  test("override arg takes precedence over env var", () => {
    process.env.ACMODS_CONFIG = join(tmpDir, "env-config.json");
    const override = join(tmpDir, "override-config.json");
    expect(getConfigPath(override)).toBe(override);
  });
});

describe("readConfig", () => {
  test("returns null when file does not exist", async () => {
    const result = await readConfig(join(tmpDir, "nonexistent.json"));
    expect(result).toBeNull();
  });

  test("returns parsed config when file exists", async () => {
    const configPath = join(tmpDir, "config.json");
    const config = { mods_directory: "/some/path/to/mods" };
    await writeJson(configPath, config);
    const result = await readConfig(configPath);
    expect(result).toEqual(config);
  });

  test("returned config has mods_directory field", async () => {
    const configPath = join(tmpDir, "config.json");
    await writeJson(configPath, { mods_directory: "/mods" });
    const result = await readConfig(configPath);
    expect(result?.mods_directory).toBe("/mods");
  });
});

describe("writeConfig", () => {
  test("creates the config file", async () => {
    const configPath = join(tmpDir, "nested", "config.json");
    await writeConfig({ mods_directory: "/my/mods" }, configPath);
    const result = await readConfig(configPath);
    expect(result).toEqual({ mods_directory: "/my/mods" });
  });

  test("creates parent directories automatically", async () => {
    const configPath = join(tmpDir, "a", "b", "c", "config.json");
    await writeConfig({ mods_directory: "/mods" }, configPath);
    const result = await readConfig(configPath);
    expect(result?.mods_directory).toBe("/mods");
  });

  test("overwrites an existing config", async () => {
    const configPath = join(tmpDir, "config.json");
    await writeConfig({ mods_directory: "/old" }, configPath);
    await writeConfig({ mods_directory: "/new" }, configPath);
    const result = await readConfig(configPath);
    expect(result?.mods_directory).toBe("/new");
  });
});
