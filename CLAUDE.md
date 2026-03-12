# acmods

Bun monorepo CLI for scaffolding Assetto Corsa (racing sim) track mods.

## Monorepo Layout

```
acmods/                              ← repo root, no source here
├── package.json                     ← workspaces: ["cli", "blender-scripts"]
├── cli/                             ← the acmods CLI binary package
│   ├── package.json                 ← name: acmods, bin: acmods → src/index.ts
│   └── src/
│       ├── index.ts                 ← Commander setup + preAction config guard
│       ├── commands/                ← one file per subcommand
│       │   ├── setup.ts             ← interactive wizard: sets mods_directory
│       │   ├── config.ts            ← displays current config
│       │   └── track-init.ts        ← main command: scaffolds a track project
│       ├── utils/
│       │   ├── fs.ts                ← Bun+Node file I/O wrappers (use these, not raw fs)
│       │   ├── log.ts               ← log.success/error/info/warn/step/header/br
│       │   ├── prompt.ts            ← promptText(), promptConfirm()
│       │   └── blender.ts           ← findBlenderBinary() cross-platform
│       ├── config/
│       │   ├── index.ts             ← re-exports manager + types
│       │   ├── manager.ts           ← readConfig / writeConfig / getConfigPath
│       │   └── types.ts             ← AcmodsConfig { mods_directory: string }
│       └── consts/
│           ├── index.ts             ← re-exports all consts
│           ├── gitfiles.ts          ← GITATTRIBUTES, GITIGNORE template strings
│           ├── ui.ts                ← UiTrack interface, defaultUiTrack()
│           └── ac-track-files/
│               ├── index.ts         ← barrel re-export for all INI consts
│               ├── audio-sources.ts ← AUDIO_SOURCES_INI
│               ├── cameras.ts       ← CAMERAS_INI
│               ├── crew.ts          ← CREW_INI
│               ├── groove.ts        ← GROOVE_INI
│               ├── lighting.ts      ← LIGHTING_INI
│               └── surfaces.ts      ← SURFACES_INI
└── blender-scripts/                 ← workspace package: @acmods/blender-scripts
    ├── package.json                 ← name: @acmods/blender-scripts
    └── src/
        ├── index.ts                 ← exports Python scripts as text imports
        └── scripts/
            └── create-blend.py     ← Python run by Blender CLI to create .blend
```

## Key Dev Commands

All commands run from `cli/` unless noted.

```bash
bun run dev -- <command> [flags]   # run without building
bun run build                      # compile → ./cli/acmods (standalone binary)
bun test                           # run test suite
```

## TypeScript Conventions

- Strict mode, `noEmit: true`, `moduleResolution: bundler`, `verbatimModuleSyntax: true`
- All imports use `.ts` extensions — required by verbatimModuleSyntax
- Use `import type` for type-only imports
- No new barrel files; use the existing `index.ts` re-exporters

## Adding a New Command

1. Create `cli/src/commands/<name>.ts` — export `registerXxx(program: Command)`
2. Follow the pattern in any existing command file
3. In `cli/src/index.ts`: add import + call `registerXxx(program)` alongside others
4. preAction guard (line 22) blocks commands requiring config. Add your command name to `["setup", "config", ...]` only if it should work without `mods_directory` configured
5. Verify: `cd cli && bun run dev -- <name> --help`

## Config System

- File: `~/.config/acmods/config.json` — `{ mods_directory: string }`
- Override: `ACMODS_CONFIG` env var or `--config <path>` CLI flag
- `getConfigPath(override?)` → resolves active path
- `readConfig(path)` → `AcmodsConfig | null`
- `writeConfig(config, path)` → writes JSON

## Logging Conventions

```ts
log.success("completed")   // ✓ green
log.error("failed")        // ✗ red  — use before process.exit
log.info("message")        // → cyan
log.warn("note")           // ⚠ yellow
log.step("sub-step")       // · dim  — indented, for steps within an action
log.header("Section")      // bold magenta, blank line above
log.br()                   // blank line
```

Never use `console.log` directly.

## blender-scripts Package

- `@acmods/blender-scripts` is a workspace dep of `cli`
- Python scripts are exported as strings via `{ type: "text" }` imports
- CLI commands write the script string to a temp file, run Blender headlessly, then delete it
- To add a new script: add `<name>.py` in `blender-scripts/src/scripts/`, export from `blender-scripts/src/index.ts` with `{ type: "text" }`

## Assetto Corsa Track Structure

Scaffolded under `mods_directory/<name>/`:

```
<name>/
├── <name>.kn5           # Track mesh binary (Git LFS)
├── __blender/
│   └── <name>.blend     # Optional: created by Blender script
├── ai/
│   ├── fast_lane.ai
│   └── pit_lane.ai
├── data/
│   ├── audio_sources.ini
│   ├── cameras.ini
│   ├── crew.ini
│   ├── groove.ini
│   ├── lighting.ini
│   └── surfaces.ini
└── ui/
    ├── outline.png
    ├── preview.png
    └── ui_track.json
```

`surfaces.ini` default surface keys: `TARMAC`, `KERB`, `PITLANE`, `SAND`, `OFFTRACK`, `CONCRETE`.

### ui_track.json shape

```ts
interface UiTrack {
  name: string;
  description: string;
  tags: string[];       // default: ["circuit", "mod", name]
  geotags: string[];
  country: string;
  city: string;
  length: string;       // meters as string, e.g. "4200"
  width: string;
  pitboxes: string;     // default "0"
  run: string;          // "clockwise" | "anticlockwise"
}
```

## Tests

- Runner: `bun test` from `cli/`
- No tests exist yet; new test files: `cli/src/**/*.test.ts`
- API: `import { describe, test, expect, beforeEach, afterEach } from "bun:test"`
- Isolate FS effects: use `ACMODS_CONFIG` env var pointing at a temp file + `mkdtemp` from `node:os`
- Priority targets: `config/manager.ts`, `utils/fs.ts`, `consts/ui.ts`

## Subagent Usage Guide

**Do NOT spawn an Explore agent** for:
- Finding a file — it's in the layout above
- How commands are registered — read `cli/src/index.ts` (34 lines)
- Config flow — read `cli/src/config/manager.ts` (~25 lines)
- Logging API — read `cli/src/utils/log.ts` (~45 lines)

**Spawn an Explore agent** when:
- You need the full content of multiple INI constant files before modifying them
- You need to understand the full `track-init.ts` scaffolding flow in detail
- You are debugging an unexpected interaction across 3+ files

**Use a Plan agent** when a task requires adding more than one new file or modifying more than three existing files.
