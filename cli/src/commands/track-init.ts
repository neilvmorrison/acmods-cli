import type { Command } from "commander";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rm } from "node:fs/promises";
import {
  createDir,
  writeFile,
  writeJson,
  dirExists,
  normalizePath,
} from "../utils/fs.ts";
import { getConfigPath, readConfig } from "../config/index.ts";
import { promptText, promptConfirm } from "../utils/prompt.ts";
import { log } from "../utils/log.ts";
import { findBlenderBinary } from "../utils/blender.ts";
import { createBlend } from "@acmods/blender-scripts";
import {
  GITATTRIBUTES,
  GITIGNORE,
  AUDIO_SOURCES_INI,
  CAMERAS_INI,
  CREW_INI,
  GROOVE_INI,
  LIGHTING_INI,
  SURFACES_INI,
  defaultUiTrack,
} from "../consts/index.ts";
import type { UiTrack } from "../consts/index.ts";

async function collectMandatory(
  nameFlag?: string,
): Promise<{ name: string; initGit: boolean }> {
  const name = nameFlag ?? (await promptText("Project name"));

  if (!name) {
    log.error("Project name is required");
    process.exit(1);
  }

  log.br();
  log.info(
    "Git LFS tracks binary assets (.kn5, .blend, .ai, .png) outside the main\n" +
      "  repo history, keeping clone sizes small.",
  );
  const initGit = await promptConfirm("Initialize with git?", true);

  return { name, initGit };
}

async function collectMetadata(name: string): Promise<UiTrack> {
  const defaults = defaultUiTrack(name);

  const description = await promptText("Description", defaults.description);
  const tagsRaw = await promptText(
    "Tags (comma-separated)",
    defaults.tags.join(", "),
  );
  const country = await promptText("Country", defaults.country);
  const city = await promptText("City", defaults.city);
  const geoTagsRaw = await promptText(
    "Geo Tags (latitude/longitude, comma-separated)",
  );
  const length = await promptText("Length", defaults.length);
  const width = await promptText("Width", defaults.width);
  const pitboxes = await promptText("Pitboxes", defaults.pitboxes);
  const run = await promptText(
    "Run direction (clockwise/anticlockwise)",
    defaults.run,
  );

  return {
    ...defaults,
    description,
    tags: tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    geotags: geoTagsRaw
      .split(",")
      .map((gt) => gt.trim())
      .filter(Boolean),
    country,
    city,
    length,
    width,
    pitboxes,
    run,
  };
}

export async function scaffoldTrack(
  name: string,
  outputDir: string,
  metadata: UiTrack,
  initGit: boolean,
): Promise<void> {
  const trackDir = join(outputDir, name);

  if (dirExists(trackDir)) {
    log.error(`Directory already exists: ${trackDir}`);
    process.exit(1);
  }

  log.header("Scaffolding track");

  for (const subdir of ["ai", "data", "ui"]) {
    await createDir(join(trackDir, subdir));
    log.step(`mkdir ${name}/${subdir}/`);
  }

  const placeholders: [string, string][] = [
    [join(trackDir, `${name}.kn5`), ""],
    [join(trackDir, "ai", "fast_lane.ai"), ""],
    [join(trackDir, "ai", "pit_lane.ai"), ""],
    [join(trackDir, "ui", "outline.png"), ""],
    [join(trackDir, "ui", "preview.png"), ""],
  ];
  for (const [path, content] of placeholders) {
    await writeFile(path, content);
    log.step(`create ${path.replace(outputDir + "/", "")}`);
  }

  if (initGit) {
    await writeFile(join(trackDir, ".gitattributes"), GITATTRIBUTES);
    await writeFile(join(trackDir, ".gitignore"), GITIGNORE);
    log.step("create .gitattributes, .gitignore");
  }

  const iniFiles: [string, string][] = [
    ["data/audio_sources.ini", AUDIO_SOURCES_INI],
    ["data/cameras.ini", CAMERAS_INI],
    ["data/crew.ini", CREW_INI],
    ["data/groove.ini", GROOVE_INI],
    ["data/lighting.ini", LIGHTING_INI],
    ["data/surfaces.ini", SURFACES_INI],
  ];
  for (const [rel, content] of iniFiles) {
    await writeFile(join(trackDir, rel), content);
    log.step(`create ${name}/${rel}`);
  }

  await writeJson(join(trackDir, "ui", "ui_track.json"), metadata);
  log.step(`create ${name}/ui/ui_track.json`);

  log.success(`Track scaffolded at ${trackDir}`);

  if (initGit) {
    log.header("Initializing git");

    const git = (args: string[]) =>
      Bun.spawnSync(["git", ...args], {
        cwd: trackDir,
        stdout: "pipe",
        stderr: "pipe",
      });

    const steps: [string[], string][] = [
      [["init"], "git init"],
      [["lfs", "install"], "git lfs install"],
      [["add", "."], "git add ."],
      [["commit", "-m", `Initial template: ${name}`], `git commit`],
    ];

    for (const [args, label] of steps) {
      const result = git(args);
      if (result.exitCode !== 0) {
        log.error(`${label} failed`);
        process.exit(1);
      }
      log.step(label);
    }

    log.success("Git repo initialized with LFS");
  }
}

async function scaffoldBlend(
  name: string,
  trackDir: string,
  blenderBin: string,
): Promise<void> {
  const blenderDir = join(trackDir, "__blender");
  await createDir(blenderDir);
  log.step(`mkdir ${name}/__blender/`);

  const blendPath = join(blenderDir, `${name}.blend`);
  const tempScript = join(tmpdir(), `acmods-${name}-${Date.now()}.py`);

  await writeFile(tempScript, createBlend);

  log.info("Running Blender in background to create .blend file...");
  const result = Bun.spawnSync([blenderBin, "--background", "--python", tempScript, "--", blendPath], {
    stdout: "pipe",
    stderr: "pipe",
  });

  await rm(tempScript, { force: true });

  if (result.exitCode !== 0) {
    log.error("Blender exited with an error — .blend file was not created");
    log.error(result.stderr.toString().trim());
    return;
  }

  log.success(`Created ${name}/__blender/${name}.blend`);
}

export function registerTrackInit(program: Command) {
  program
    .command("track-init")
    .description("Initialize a new Assetto Corsa track mod project")
    .option("-n, --name <name>", "Name of the track (skips name prompt)")
    .option(
      "-o, --output-dir <dir>",
      "Output directory (defaults to mods_directory from config)",
    )
    .action(async (options: { name?: string; outputDir?: string }) => {
      const { name, initGit } = await collectMandatory(options.name);

      log.br();
      const fillMetadata = await promptConfirm(
        "Configure track metadata now? (you can edit ui/ui_track.json later)",
        false,
      );

      const metadata = fillMetadata
        ? await collectMetadata(name)
        : defaultUiTrack(name);

      const configPath = getConfigPath(
        program.opts().config as string | undefined,
      );
      const config = await readConfig(configPath);
      const outputDir = normalizePath(
        options.outputDir ?? config?.mods_directory ?? process.cwd(),
      );

      const trackDir = join(outputDir, name);
      await scaffoldTrack(name, outputDir, metadata, initGit);

      const blenderBin = findBlenderBinary();
      if (blenderBin) {
        log.br();
        const createBlendFile = await promptConfirm(
          "Create a .blend file for this track?",
          false,
        );
        if (createBlendFile) {
          await scaffoldBlend(name, trackDir, blenderBin);
        }
      }

      log.br();
      const openDir = await promptConfirm("Open project directory?", false);
      if (openDir) {
        const opener =
          process.platform === "win32"
            ? "explorer"
            : process.platform === "darwin"
              ? "open"
              : "xdg-open";
        Bun.spawnSync([opener, trackDir]);
      }
    });
}
