import type { Command } from "commander";
import { join } from "node:path";
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
import {
  GITIGNORE,
  CAR_INI,
  ENGINE_INI,
  DRIVETRAIN_INI,
  SUSPENSIONS_INI,
  TYRES_INI,
  BRAKES_INI,
  ELECTRONICS_INI,
  defaultUiCar,
} from "../consts/index.ts";
import type { UiCar } from "../consts/index.ts";

const CAR_GITATTRIBUTES = `\
*.kn5 filter=lfs diff=lfs merge=lfs -text
*.dds filter=lfs diff=lfs merge=lfs -text
*.ksanim filter=lfs diff=lfs merge=lfs -text
*.bank filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
`;

const SKIN_INI = `[SKIN]
DRIVERNAME=
COUNTRY=
NUMBER=0
TEAM=
`;

const UI_SKIN_JSON = JSON.stringify(
  {
    driverName: "",
    country: "",
    number: "0",
    team: "",
    skinName: "default",
    priority: 0,
  },
  null,
  2,
);

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
    "Git LFS tracks binary assets (.kn5, .dds, .ksanim, .bank) outside the main\n" +
      "  repo history, keeping clone sizes small.",
  );
  const initGit = await promptConfirm("Initialize with git?", true);

  return { name, initGit };
}

async function collectMetadata(name: string): Promise<UiCar> {
  const defaults = defaultUiCar(name);

  const brand = await promptText("Brand/Team", defaults.brand);
  const description = await promptText("Description", defaults.description);
  const carClass = await promptText("Class (race/road/street)", defaults.class);
  const tagsRaw = await promptText(
    "Tags (comma-separated)",
    defaults.tags.join(", "),
  );
  const bhp = await promptText("BHP", defaults.specs.bhp);
  const torque = await promptText("Torque", defaults.specs.torque);
  const weight = await promptText("Weight", defaults.specs.weight);
  const topspeed = await promptText("Top speed", defaults.specs.topspeed);
  const country = await promptText("Country", defaults.country);
  const author = await promptText("Author", defaults.author);
  const yearRaw = await promptText("Year", String(defaults.year));

  return {
    ...defaults,
    brand,
    description,
    class: carClass,
    tags: tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    specs: {
      ...defaults.specs,
      bhp,
      torque,
      weight,
      topspeed,
    },
    country,
    author,
    year: parseInt(yearRaw, 10) || defaults.year,
  };
}

export async function scaffoldCar(
  name: string,
  outputDir: string,
  metadata: UiCar,
  initGit: boolean,
): Promise<void> {
  const carDir = join(outputDir, name);

  if (dirExists(carDir)) {
    log.error(`Directory already exists: ${carDir}`);
    process.exit(1);
  }

  log.header("Scaffolding car");

  for (const subdir of ["animations", "sfx", "data", "ui"]) {
    await createDir(join(carDir, subdir));
    log.step(`mkdir ${name}/${subdir}/`);
  }
  await createDir(join(carDir, "skins", "default"));
  log.step(`mkdir ${name}/skins/default/`);

  const placeholders: [string, string][] = [
    [join(carDir, `${name}.kn5`), ""],
    [join(carDir, "collider.kn5"), ""],
    [join(carDir, "driver_base_pos.knh"), ""],
    [join(carDir, "data.acd"), ""],
    [join(carDir, "logo.png"), ""],
    [join(carDir, "body_shadow.png"), ""],
    [join(carDir, "tyre_0_shadow.png"), ""],
    [join(carDir, "tyre_1_shadow.png"), ""],
    [join(carDir, "tyre_2_shadow.png"), ""],
    [join(carDir, "tyre_3_shadow.png"), ""],
    [join(carDir, "sfx", "GUIDs.txt"), ""],
  ];
  for (const [path, content] of placeholders) {
    await writeFile(path, content);
    log.step(`create ${path.replace(outputDir + "/", "")}`);
  }

  if (initGit) {
    await writeFile(join(carDir, ".gitattributes"), CAR_GITATTRIBUTES);
    await writeFile(join(carDir, ".gitignore"), GITIGNORE);
    log.step("create .gitattributes, .gitignore");
  }

  const iniFiles: [string, string][] = [
    ["data/car.ini", CAR_INI],
    ["data/engine.ini", ENGINE_INI],
    ["data/drivetrain.ini", DRIVETRAIN_INI],
    ["data/suspensions.ini", SUSPENSIONS_INI],
    ["data/tyres.ini", TYRES_INI],
    ["data/brakes.ini", BRAKES_INI],
    ["data/electronics.ini", ELECTRONICS_INI],
  ];
  for (const [rel, content] of iniFiles) {
    await writeFile(join(carDir, rel), content);
    log.step(`create ${name}/${rel}`);
  }

  await writeFile(join(carDir, "skins", "default", "skin.ini"), SKIN_INI);
  log.step(`create ${name}/skins/default/skin.ini`);

  await writeFile(join(carDir, "skins", "default", "ui_skin.json"), UI_SKIN_JSON);
  log.step(`create ${name}/skins/default/ui_skin.json`);

  await writeJson(join(carDir, "ui", "ui_car.json"), metadata);
  log.step(`create ${name}/ui/ui_car.json`);

  log.success(`Car scaffolded at ${carDir}`);

  if (initGit) {
    log.header("Initializing git");

    const git = (args: string[]) =>
      Bun.spawnSync(["git", ...args], {
        cwd: carDir,
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

export function registerCarInit(program: Command) {
  program
    .command("car-init")
    .description("Initialize a new Assetto Corsa car mod project")
    .option("-n, --name <name>", "Name of the car (skips name prompt)")
    .option(
      "-o, --output-dir <dir>",
      "Output directory (defaults to mods_directory from config)",
    )
    .action(async (options: { name?: string; outputDir?: string }) => {
      const { name, initGit } = await collectMandatory(options.name);

      log.br();
      const fillMetadata = await promptConfirm(
        "Configure car metadata now? (you can edit ui/ui_car.json later)",
        false,
      );

      const metadata = fillMetadata
        ? await collectMetadata(name)
        : defaultUiCar(name);

      const configPath = getConfigPath(
        program.opts().config as string | undefined,
      );
      const config = await readConfig(configPath);
      const outputDir = normalizePath(
        options.outputDir ?? config?.mods_directory ?? process.cwd(),
      );

      await scaffoldCar(name, outputDir, metadata, initGit);

      log.br();
      const openDir = await promptConfirm("Open project directory?", false);
      if (openDir) {
        const opener =
          process.platform === "win32"
            ? "explorer"
            : process.platform === "darwin"
              ? "open"
              : "xdg-open";
        Bun.spawnSync([opener, join(outputDir, name)]);
      }
    });
}
