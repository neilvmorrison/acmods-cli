const isTTY = process.stdout.isTTY && !process.env.NO_COLOR;

const c = {
  reset:   isTTY ? "\x1b[0m"  : "",
  bold:    isTTY ? "\x1b[1m"  : "",
  dim:     isTTY ? "\x1b[2m"  : "",
  green:   isTTY ? "\x1b[32m" : "",
  red:     isTTY ? "\x1b[31m" : "",
  yellow:  isTTY ? "\x1b[33m" : "",
  cyan:    isTTY ? "\x1b[36m" : "",
  magenta: isTTY ? "\x1b[35m" : "",
  white:   isTTY ? "\x1b[97m" : "",
};

const fmt = (color: string, symbol: string, msg: string) =>
  `${color}${symbol}${c.reset} ${msg}`;

export const log = {
  /** Green ✓ — something completed successfully */
  success: (msg: string) =>
    console.log(fmt(c.green + c.bold, "✓", `${c.white}${msg}${c.reset}`)),

  /** Red ✗ — something went wrong */
  error: (msg: string) =>
    console.error(fmt(c.red + c.bold, "✗", `${c.red}${msg}${c.reset}`)),

  /** Cyan → — neutral information */
  info: (msg: string) =>
    console.log(fmt(c.cyan, "→", msg)),

  /** Yellow ⚠ — worth noting but not fatal */
  warn: (msg: string) =>
    console.log(fmt(c.yellow, "⚠", `${c.yellow}${msg}${c.reset}`)),

  /** Dim · — sub-step inside a larger operation */
  step: (msg: string) =>
    console.log(`  ${c.dim}·${c.reset} ${c.dim}${msg}${c.reset}`),

  /** Bold section header with a blank line above */
  header: (msg: string) =>
    console.log(`\n${c.magenta}${c.bold}${msg}${c.reset}`),

  /** Plain blank line */
  br: () => console.log(""),
};
