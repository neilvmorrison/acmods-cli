import { mkdir, rm, readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

// --- Files ---

export async function readFile(path: string): Promise<string> {
  return Bun.file(path).text();
}

export async function writeFile(path: string, content: string): Promise<void> {
  await Bun.write(path, content);
}

export async function deleteFile(path: string): Promise<void> {
  await rm(path);
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}

// --- Directories ---

export async function createDir(
  path: string,
  recursive = true
): Promise<void> {
  await mkdir(path, { recursive });
}

export async function deleteDir(path: string): Promise<void> {
  await rm(path, { recursive: true });
}

export async function listDir(path: string): Promise<string[]> {
  return readdir(path);
}

export function dirExists(path: string): boolean {
  if (!existsSync(path)) return false;
  return statSync(path).isDirectory();
}

// --- Helpers ---

export async function copyFile(src: string, dest: string): Promise<void> {
  const content = await Bun.file(src).arrayBuffer();
  await Bun.write(dest, content);
}

export async function readJson<T = unknown>(path: string): Promise<T> {
  const text = await Bun.file(path).text();
  return JSON.parse(text) as T;
}

export async function writeJson(
  path: string,
  data: unknown,
  indent = 2
): Promise<void> {
  await Bun.write(path, JSON.stringify(data, null, indent) + "\n");
}

export function normalizePath(p: string): string {
  const stripped = p.replace(/^["']|["']$/g, "").trim();
  const expanded = stripped.startsWith("~") ? stripped.replace("~", homedir()) : stripped;
  return resolve(expanded);
}

export { join };
