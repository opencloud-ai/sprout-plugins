// Confirms that the live Sprout MCP server still offers every tool the skill
// names and the sprout-skill resource. Uses one anonymous session, which it
// deletes before exiting; no sign-in or credentials are involved.
import { readFile } from "node:fs/promises";

import { readJson, skillPath, skillToolNames } from "./plugin-files.mjs";

const protocolVersion = "2025-06-18";
const { url: endpoint } = (await readJson("plugins/sprout/.mcp.json"))
  .mcpServers.sprout;

let sessionId;
let nextId = 1;

async function post(method, params) {
  const id = nextId++;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": protocolVersion,
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${method}: HTTP ${response.status}`);
  sessionId ??= response.headers.get("mcp-session-id") ?? undefined;

  const body = await response.text();
  const messages = (response.headers.get("content-type") ?? "").includes(
    "text/event-stream",
  )
    ? body
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => JSON.parse(line.slice(5)))
    : [JSON.parse(body)];
  const message = messages.find((candidate) => candidate.id === id);
  if (!message) throw new Error(`${method}: no response`);
  if (message.error) {
    throw new Error(`${method}: ${message.error.code} ${message.error.message}`);
  }
  return message.result;
}

async function notify(method) {
  await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": protocolVersion,
      "mcp-session-id": sessionId,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method }),
    signal: AbortSignal.timeout(20_000),
  });
}

async function listAll(method, key) {
  const items = [];
  let cursor;
  do {
    const result = await post(method, cursor ? { cursor } : {});
    items.push(...result[key]);
    cursor = result.nextCursor;
  } while (cursor);
  return items;
}

const failures = [];
try {
  const initialized = await post("initialize", {
    protocolVersion,
    capabilities: {},
    clientInfo: { name: "sprout-plugin-live-check", version: "1.0.0" },
  });
  await notify("notifications/initialized");

  if (initialized.serverInfo?.name !== "Sprout") {
    failures.push(`server name is ${initialized.serverInfo?.name}, not Sprout`);
  }

  const tools = new Set(
    (await listAll("tools/list", "tools")).map((tool) => tool.name),
  );
  const skillTools = skillToolNames(await readFile(skillPath, "utf8"));
  for (const name of skillTools) {
    if (!tools.has(name)) failures.push(`the server has no ${name} tool`);
  }

  const resources = await listAll("resources/list", "resources");
  if (!resources.some((resource) => resource.name === "sprout-skill")) {
    failures.push("the server has no sprout-skill resource");
  }

  console.log(
    `${endpoint}: ${tools.size} tools; the skill names ${skillTools.length}.`,
  );
} finally {
  if (sessionId) {
    await fetch(endpoint, {
      method: "DELETE",
      headers: { "mcp-session-id": sessionId },
      signal: AbortSignal.timeout(20_000),
    }).catch(() => {});
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✘ ${failure}`);
  process.exit(1);
}
console.log("✔ Every tool the skill names, and sprout-skill, is live.");
