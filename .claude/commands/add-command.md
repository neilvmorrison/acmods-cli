Add a new subcommand to the acmods CLI.

The user will specify the command name and what it should do.

## Step 1: Create the command file

Create `cli/src/commands/<name>.ts`:

```ts
import type { Command } from "commander";
import { log } from "../utils/log.ts";
// import other utils as needed

export function register<Name>(program: Command) {
  program
    .command("<name>")
    .description("<description>")
    .option("-n, --name <name>", "example option")
    .action(async (options) => {
      // implementation
    });
}
```

Rules:
- All imports must use `.ts` extensions
- Use `import type` for type-only imports
- Use `log.*` from `../utils/log.ts` for all output — never `console.log`
- Use `promptText` / `promptConfirm` from `../utils/prompt.ts` for interactive input
- Use helpers from `../utils/fs.ts` for file I/O

## Step 2: Register in index.ts

In `cli/src/index.ts`, add:
1. Import: `import { register<Name> } from "./commands/<name>.ts";`
2. Call: `register<Name>(program);` alongside the other register calls

## Step 3: Decide on preAction guard

The `preAction` hook (line 22 of `index.ts`) blocks all commands unless `mods_directory` is configured. If your command should work WITHOUT setup (like `setup` and `config`), add its name to the exclusion array:

```ts
if (["setup", "config", "<name>"].includes(actionCommand.name())) return;
```

Otherwise leave it unchanged — the guard protects your command automatically.

## Step 4: Verify

```bash
cd /Users/neilmorrison/projects/acmods/cli && bun run dev -- <name> --help
```
