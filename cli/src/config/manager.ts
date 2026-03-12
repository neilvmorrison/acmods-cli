import { join } from "node:path";
import { homedir } from "node:os";
import { fileExists, readJson, writeJson, createDir } from "../utils/fs.ts";
import { log } from "../utils/log.ts";
import type { AcmodsConfig } from "./types.ts";

const DEFAULT_CONFIG_PATH = join(homedir(), ".config", "acmods", "config.json");

export function getConfigPath(override?: string): string {
  return override ?? process.env.ACMODS_CONFIG ?? DEFAULT_CONFIG_PATH;
}

export async function readConfig(configPath: string): Promise<AcmodsConfig | null> {
  if (!fileExists(configPath)) return null;
  return readJson<AcmodsConfig>(configPath);
}

export async function writeConfig(config: AcmodsConfig, configPath: string): Promise<void> {
  const dir = configPath.substring(0, configPath.lastIndexOf("/"));
  await createDir(dir);
  await writeJson(configPath, config);
  log.success(`Config saved to: ${configPath}`);
}
