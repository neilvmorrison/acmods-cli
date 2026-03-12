# AC-Mods CLI

A command-line tool for scaffolding and managing Assetto Corsa mod projects. This is an evolving library — commands will be added as new scripting needs arise.

## What Is This?

Assetto Corsa loads game assets (cars, tracks, skins) from specific directory structures inside the game's `content/` folder. Mods must implement this structure exactly or the engine won't load them.

This CLI automates that scaffolding — generating the correct directories, placeholder files, and configuration stubs so you can focus on the actual mod work.

## Installation

### From Binary (Recommended)

1. Download the [latest binary](https://github.com/neilvmorrison/acmods-cli/releases)
2. Unzip the file
3. Add the binary to your `PATH`. On macOS/Linux, add this to your `.zshrc` or `.bashrc`:
   ```bash
   export PATH="$PATH:/path/to/directory/containing/acmods"
   ```
4. Reload your shell: `source ~/.zshrc` (or open a new terminal)
5. Verify the install:
   ```bash
   acmods -v
   ```

### From Source

Requires [Bun](https://bun.sh) to be installed.

```bash
git clone https://github.com/neilvmorrison/acmods-cli
cd acmods-cli
bun install
bun run dev -- --help
```

## Setup

Before using most commands, run the setup wizard to configure your Assetto Corsa mods directory:

```bash
acmods setup
```

This prompts you for the path to your `content/tracks` (or equivalent mods) directory and saves it to a local config file. You only need to do this once.

To view your current configuration:

```bash
acmods config
```

To use a custom config file path:

```bash
acmods --config /path/to/config.json <command>
```

## Commands

### `acmods setup`

Interactive wizard to configure `acmods`. Sets the `mods_directory` where scaffolded projects will be created.

```bash
acmods setup
```

---

### `acmods config`

Displays the current configuration and config file path.

```bash
acmods config
```

---

### `acmods track-init`

Scaffolds a new Assetto Corsa track mod project with the correct directory structure, required INI files, and an optional git repo with LFS configured for binary assets.

```bash
acmods track-init
```

**Options:**

| Flag | Description |
|------|-------------|
| `-n, --name <name>` | Track project name (skips the name prompt) |
| `-o, --output-dir <dir>` | Output directory (defaults to `mods_directory` from config) |

**What it creates:**

```
<track-name>/
├── <track-name>.kn5        # Placeholder for the track mesh
├── .gitattributes          # Git LFS tracking rules (if git enabled)
├── .gitignore
├── ai/
│   ├── fast_lane.ai        # AI racing line placeholder
│   └── pit_lane.ai         # AI pit lane placeholder
├── data/
│   ├── audio_sources.ini
│   ├── cameras.ini
│   ├── crew.ini
│   ├── groove.ini
│   ├── lighting.ini
│   └── surfaces.ini
└── ui/
    ├── outline.png          # Track map placeholder
    ├── preview.png          # Preview image placeholder
    └── ui_track.json        # Track metadata (name, description, tags, etc.)
```

If you opt into git initialization, the command will:
- Run `git init`
- Install Git LFS and configure it to track binary assets (`.kn5`, `.blend`, `.ai`, `.png`)
- Create an initial commit

---

## For Developers

### Stack

- **Runtime:** [Bun](https://bun.sh)
- **Language:** TypeScript
- **CLI framework:** Commander.js
- **Distribution:** `bun build --compile` — produces a standalone binary with no runtime dependency

### Project Structure

```
src/
├── index.ts              # Entry point — sets up Commander program
├── commands/
│   ├── config.ts         # `acmods config` command
│   ├── setup.ts          # `acmods setup` command
│   └── track-init.ts     # `acmods track-init` command
├── config/               # Config file read/write logic
├── consts/               # INI file templates and default metadata
└── utils/                # fs, logging, and prompt helpers
```

### Dev Scripts

```bash
bun run dev -- <command>   # Run without building
bun run build              # Compile standalone binary → ./acmods
bun test                   # Run tests
```

### Adding a New Command

1. Create `src/commands/my-command.ts`
2. Export a `registerMyCommand(program: Command)` function
3. Import and call it in `src/index.ts`

Commands that require configuration (i.e. `mods_directory`) will automatically be guarded by the `preAction` hook in `index.ts` — no extra setup needed.

## Contributing

Issues and PRs welcome. Please open an issue before starting significant work so we can align on direction.
