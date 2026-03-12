import type { Command } from "commander";
import { getConfigPath, readConfig, writeConfig } from "../config/index.ts";
import { normalizePath } from "../utils/fs.ts";
import { promptText } from "../utils/prompt.ts";
import { log } from "../utils/log.ts";

export function registerSetup(program: Command) {
  program
    .command("setup")
    .description("Configure acmods settings")
    .action(async () => {
      const configPath = getConfigPath(program.opts().config as string | undefined);
      const existing = await readConfig(configPath);

      const modsDirectory = normalizePath(await promptText("Mods directory", existing?.mods_directory ?? ""));

      if (!modsDirectory) {
        log.error("mods_directory cannot be empty");
        process.exit(1);
      }

      await writeConfig({ mods_directory: modsDirectory }, configPath);
    });
}
