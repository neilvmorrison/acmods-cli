Add a new Blender Python script to the acmods blender-scripts package.

## Step 1: Create the Python script

Create `blender-scripts/src/scripts/<name>.py`:

```python
"""
<Description>

Usage (via Blender CLI):
    blender --background --python <name>.py -- <args...>
"""

import bpy
import sys
import os

def main(output_path: str) -> None:
    # implementation
    # Always set metric units for AC authoring:
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    # Save:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(output_path))

if __name__ == "__main__":
    if "--" not in sys.argv:
        print("Error: no arguments. Usage: blender --background --python <name>.py -- <output_path>")
        sys.exit(1)
    args = sys.argv[sys.argv.index("--") + 1:]
    main(args[0])
```

## Step 2: Export from blender-scripts/src/index.ts

```ts
import <camelCaseName> from "./scripts/<name>.py" with { type: "text" };

export { <camelCaseName> };
```

The `{ type: "text" }` assertion causes Bun to embed the file as a string at build time.

## Step 3: Use from a CLI command

```ts
import { <camelCaseName> } from "@acmods/blender-scripts";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rm } from "node:fs/promises";
import { writeFile } from "../utils/fs.ts";
import { findBlenderBinary } from "../utils/blender.ts";

const blenderBin = findBlenderBinary();
if (blenderBin) {
  const tempScript = join(tmpdir(), `acmods-<name>-${Date.now()}.py`);
  try {
    await writeFile(tempScript, <camelCaseName>);
    const result = Bun.spawnSync(
      [blenderBin, "--background", "--python", tempScript, "--", ...args],
      { stdout: "pipe", stderr: "pipe" }
    );
    if (result.exitCode !== 0) {
      log.error("Blender exited with an error");
      log.error(result.stderr.toString().trim());
    }
  } finally {
    await rm(tempScript, { force: true });
  }
}
```

Always use try/finally to ensure temp script cleanup.
