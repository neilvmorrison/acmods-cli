Add a new INI file constant to the acmods track scaffolding system.

## Step 1: Create the constant file

Create `cli/src/consts/ac-track-files/<name>.ts`:

```ts
export const <NAME>_INI = `\
[SECTION]
KEY=VALUE
`;
```

- Use a trailing backslash after the opening backtick to avoid a leading newline
- Name: `<SCREAMING_SNAKE>_INI` matching filename — e.g. `audio-sources.ts` → `AUDIO_SOURCES_INI`
- End with a final newline before the closing backtick

## Step 2: Re-export from the barrel

Add to `cli/src/consts/ac-track-files/index.ts`:

```ts
export * from "./<name>.ts";
```

The top-level `cli/src/consts/index.ts` already re-exports everything from `ac-track-files/index.ts`.

## Step 3: Add to track-init scaffolding

In `cli/src/commands/track-init.ts`:

1. Add to the destructured import from `../consts/index.ts`:
```ts
import { ..., <NAME>_INI } from "../consts/index.ts";
```

2. Add an entry to the `iniFiles` array inside `scaffoldTrack()`:
```ts
["data/<filename>.ini", <NAME>_INI],
```

The existing loop over `iniFiles` writes all entries automatically.
