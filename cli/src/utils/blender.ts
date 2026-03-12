import { platform } from "os";

const MACOS_BLENDER_PATH = "/Applications/Blender.app/Contents/MacOS/Blender";
const WINDOWS_BLENDER_GLOB =
  "C:\\Program Files\\Blender Foundation\\Blender*\\blender.exe";

export function findBlenderBinary(): string | null {
  const os = platform();

  // Try PATH first on all platforms
  const whichCmd = os === "win32" ? "where" : "which";
  const result = Bun.spawnSync([whichCmd, "blender"]);
  if (result.exitCode === 0 && result.stdout) {
    return result.stdout.toString()?.trim()?.split("\n")[0]?.trim() ?? "";
  }

  // macOS fallback
  if (os === "darwin") {
    const file = Bun.file(MACOS_BLENDER_PATH);
    if (file.size > 0) return MACOS_BLENDER_PATH;
  }

  // Windows fallback: glob for installed versions
  if (os === "win32") {
    const glob = new Bun.Glob(WINDOWS_BLENDER_GLOB);
    for (const match of glob.scanSync()) {
      return match;
    }
  }

  return null;
}
