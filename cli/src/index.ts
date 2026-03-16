#!/usr/bin/env bun
import { Command } from "commander";
import { registerTrackInit } from "./commands/track-init.ts";
import { registerCarInit } from "./commands/car-init.ts";
import { registerSetup } from "./commands/setup.ts";
import { registerConfig } from "./commands/config.ts";
import { getConfigPath, readConfig } from "./config/index.ts";
import { log } from "./utils/log.ts";

const program = new Command();

program
  .name("acmods")
  .description("CLI tool for Assetto Corsa mod management")
  .version("0.1.0", "-v, --version")
  .option("-c, --config <path>", "Path to config file");

registerSetup(program);
registerConfig(program);
registerTrackInit(program);
registerCarInit(program);

program.hook("preAction", async (_thisCommand, actionCommand) => {
  if (["setup", "config"].includes(actionCommand.name())) return;

  const configPath = getConfigPath(program.opts().config as string | undefined);
  const config = await readConfig(configPath);

  if (!config?.mods_directory) {
    log.error("No mods_directory configured. Run `acmods setup` first.");
    process.exit(1);
  }
});

await program.parseAsync();
