import type { Command } from "commander";
import { getConfigPath, readConfig } from "../config/index.ts";
import { log } from "../utils/log.ts";

export function registerConfig(program: Command) {
  program
    .command("config")
    .description("Display current configuration")
    .action(async () => {
      const configPath = getConfigPath(program.opts().config as string | undefined);
      const config = await readConfig(configPath);

      log.info(`Config file: ${configPath}`);

      if (!config) {
        log.warn("No config found. Run `acmods setup` to configure.");
        return;
      }

      log.br();
      for (const [key, value] of Object.entries(config)) {
        log.step(`${key}: ${value}`);
      }
    });
}
