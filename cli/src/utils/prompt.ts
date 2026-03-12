import { createInterface } from "node:readline/promises";

// Opens a readline interface for a single question then immediately closes it.
// Keeping it short-lived avoids leaving stdin open between prompts.
async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

/**
 * Prompt for a text value. Shows the default in brackets if provided.
 * Pressing enter with no input returns the default.
 */
export async function promptText(question: string, defaultValue = ""): Promise<string> {
  const hint = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await ask(`${question}${hint}: `);
  return answer || defaultValue;
}

/**
 * Prompt for a yes/no confirmation.
 * @param defaultYes - if true, Y is the default (shown as [Y/n]); if false, N is default ([y/N])
 */
export async function promptConfirm(question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const answer = await ask(`${question} ${hint}: `);
  if (!answer) return defaultYes;
  return answer.toLowerCase().startsWith("y");
}
