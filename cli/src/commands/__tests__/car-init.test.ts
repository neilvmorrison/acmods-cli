import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from "bun:test";
import { spyOn } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { scaffoldCar } from "../car-init.ts";
import { defaultUiCar } from "../../consts/ui-car.ts";
import { fileExists, dirExists, readJson } from "../../utils/fs.ts";

beforeAll(() => {
  spyOn(console, "log").mockImplementation(() => {});
  spyOn(console, "error").mockImplementation(() => {});
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "acmods-car-test-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("scaffoldCar", () => {
  const name = "test-car";

  test("creates the car root directory", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(dirExists(join(tmpDir, name))).toBe(true);
  });

  test("creates animations/ directory", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(dirExists(join(tmpDir, name, "animations"))).toBe(true);
  });

  test("creates skins/default/ directory", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(dirExists(join(tmpDir, name, "skins", "default"))).toBe(true);
  });

  test("creates sfx/ directory", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(dirExists(join(tmpDir, name, "sfx"))).toBe(true);
  });

  test("creates data/ directory", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(dirExists(join(tmpDir, name, "data"))).toBe(true);
  });

  test("creates ui/ directory", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(dirExists(join(tmpDir, name, "ui"))).toBe(true);
  });

  test("creates root placeholder files", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    const rootFiles = [
      `${name}.kn5`,
      "collider.kn5",
      "driver_base_pos.knh",
      "data.acd",
      "logo.png",
      "body_shadow.png",
      "tyre_0_shadow.png",
      "tyre_1_shadow.png",
      "tyre_2_shadow.png",
      "tyre_3_shadow.png",
    ];
    for (const file of rootFiles) {
      expect(fileExists(join(tmpDir, name, file))).toBe(true);
    }
  });

  test("creates sfx/GUIDs.txt placeholder", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(fileExists(join(tmpDir, name, "sfx", "GUIDs.txt"))).toBe(true);
  });

  test("creates all 7 INI files in data/", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    const iniFiles = [
      "car.ini",
      "engine.ini",
      "drivetrain.ini",
      "suspensions.ini",
      "tyres.ini",
      "brakes.ini",
      "electronics.ini",
    ];
    for (const file of iniFiles) {
      expect(fileExists(join(tmpDir, name, "data", file))).toBe(true);
    }
  });

  test("creates skins/default/skin.ini", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(fileExists(join(tmpDir, name, "skins", "default", "skin.ini"))).toBe(true);
  });

  test("creates skins/default/ui_skin.json", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(fileExists(join(tmpDir, name, "skins", "default", "ui_skin.json"))).toBe(true);
  });

  test("writes ui/ui_car.json with the provided metadata", async () => {
    const metadata = defaultUiCar(name);
    await scaffoldCar(name, tmpDir, metadata, false);
    const written = await readJson(join(tmpDir, name, "ui", "ui_car.json"));
    expect(written).toEqual(metadata);
  });

  test("does not create .gitattributes or .gitignore when initGit=false", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);
    expect(fileExists(join(tmpDir, name, ".gitattributes"))).toBe(false);
    expect(fileExists(join(tmpDir, name, ".gitignore"))).toBe(false);
  });

  test("creates .gitattributes when initGit=true", async () => {
    const spawnSpy = spyOn(Bun, "spawnSync").mockImplementation(
      () =>
        ({
          exitCode: 0,
          stdout: Buffer.from(""),
          stderr: Buffer.from(""),
          success: true,
        }) as ReturnType<typeof Bun.spawnSync>,
    );

    await scaffoldCar(name, tmpDir, defaultUiCar(name), true);

    expect(fileExists(join(tmpDir, name, ".gitattributes"))).toBe(true);

    spawnSpy.mockRestore();
  });

  test("creates .gitignore when initGit=true", async () => {
    const spawnSpy = spyOn(Bun, "spawnSync").mockImplementation(
      () =>
        ({
          exitCode: 0,
          stdout: Buffer.from(""),
          stderr: Buffer.from(""),
          success: true,
        }) as ReturnType<typeof Bun.spawnSync>,
    );

    await scaffoldCar(name, tmpDir, defaultUiCar(name), true);

    expect(fileExists(join(tmpDir, name, ".gitignore"))).toBe(true);

    spawnSpy.mockRestore();
  });

  test("exits with error when car directory already exists", async () => {
    await scaffoldCar(name, tmpDir, defaultUiCar(name), false);

    const exitSpy = spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    await expect(
      scaffoldCar(name, tmpDir, defaultUiCar(name), false),
    ).rejects.toThrow("process.exit called");

    exitSpy.mockRestore();
  });
});

describe("defaultUiCar", () => {
  test("sets name to the provided argument", () => {
    expect(defaultUiCar("my-car").name).toBe("my-car");
  });

  test("tags include 'race', 'mod', and the name", () => {
    const { tags } = defaultUiCar("my-car");
    expect(tags).toContain("race");
    expect(tags).toContain("mod");
    expect(tags).toContain("my-car");
  });

  test("torqueCurve defaults to empty array", () => {
    expect(defaultUiCar("my-car").torqueCurve).toEqual([]);
  });

  test("powerCurve defaults to empty array", () => {
    expect(defaultUiCar("my-car").powerCurve).toEqual([]);
  });

  test("version defaults to '1.0'", () => {
    expect(defaultUiCar("my-car").version).toBe("1.0");
  });

  test("class defaults to 'race'", () => {
    expect(defaultUiCar("my-car").class).toBe("race");
  });

  test("all required UiCar keys are present", () => {
    const car = defaultUiCar("my-car");
    const requiredKeys: Array<keyof typeof car> = [
      "name", "brand", "description", "tags", "class", "specs",
      "torqueCurve", "powerCurve", "country", "author", "version", "url", "year",
    ];
    for (const key of requiredKeys) {
      expect(car).toHaveProperty(key);
    }
  });

  test("different names produce independent tag arrays", () => {
    const a = defaultUiCar("car-a");
    const b = defaultUiCar("car-b");
    a.tags.push("extra");
    expect(b.tags).not.toContain("extra");
  });
});
