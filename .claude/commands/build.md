Build the acmods CLI binary.

Run `bun run build` from the `cli/` directory. The build script is only defined in `cli/package.json` — running from repo root will fail.

Steps:
1. Run: `cd /Users/neilmorrison/projects/acmods/cli && bun run build`
2. Confirm binary was created: check `cli/acmods` exists
3. Report file size and success, or surface the full error output on failure
