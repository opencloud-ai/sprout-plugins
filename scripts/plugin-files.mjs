import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const pluginRoot = path.join(repositoryRoot, "plugins", "sprout");
export const skillPath = path.join(
  pluginRoot,
  "skills",
  "build-apps",
  "SKILL.md",
);

// Backticked snake_case words in the skill that are error codes, not tools.
const NON_TOOL_CODES = new Set(["onboarding_rate_limited", "plan_limit_reached"]);

export async function readJson(relativePath) {
  return JSON.parse(
    await readFile(path.join(repositoryRoot, relativePath), "utf8"),
  );
}

/** The MCP tool names the skill tells Claude to call. */
export function skillToolNames(markdown) {
  const names = new Set();
  for (const [, name] of markdown.matchAll(/`([a-z][a-z0-9]*(?:_[a-z0-9]+)+)`/g)) {
    if (!NON_TOOL_CODES.has(name)) names.add(name);
  }
  return [...names].sort();
}
