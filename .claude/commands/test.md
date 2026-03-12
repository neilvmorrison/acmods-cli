Run tests or write new tests for the acmods CLI.

## Running Tests

```bash
cd /Users/neilmorrison/projects/acmods/cli && bun test
```

Specific file: `bun test src/path/to/file.test.ts`
Watch mode: `bun test --watch`

## Writing Tests

Test files go alongside the file they test: `cli/src/**/<file>.test.ts`

```ts
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
```

### Isolating File System Effects

Use a temp directory and point config at a temp file:

```ts
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "acmods-test-"));
  process.env.ACMODS_CONFIG = join(tmpDir, "config.json");
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
  delete process.env.ACMODS_CONFIG;
});
```

### Suppressing Log Output

```ts
import { spyOn } from "bun:test";
const logSpy = spyOn(console, "log").mockImplementation(() => {});
// restore after: logSpy.mockRestore();
```

### Priority Test Targets (currently untested)

1. `cli/src/config/manager.ts` — `readConfig`, `writeConfig`, `getConfigPath`
2. `cli/src/utils/fs.ts` — `normalizePath`, `dirExists`, `fileExists`
3. `cli/src/consts/ui.ts` — `defaultUiTrack` output shape
4. `cli/src/commands/track-init.ts` — scaffolded directory structure (use `mkdtemp` as output dir)
