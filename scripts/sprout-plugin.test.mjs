import assert from "node:assert/strict";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  pluginRoot,
  readJson,
  repositoryRoot,
  skillPath,
  skillToolNames,
} from "./plugin-files.mjs";

const repository = "https://github.com/opencloud-ai/sprout-plugins";

async function pluginFiles(directory = pluginRoot) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    files.push(entryPath);
    if (entry.isDirectory()) files.push(...(await pluginFiles(entryPath)));
  }
  return files;
}

function frontMatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "SKILL.md starts with YAML front matter");
  return Object.fromEntries(
    match[1].split("\n").map((line) => {
      const separator = line.indexOf(": ");
      return [line.slice(0, separator), line.slice(separator + 2)];
    }),
  );
}

test("the marketplace lists the one Sprout plugin in this repository", async () => {
  const [marketplace, manifest] = await Promise.all([
    readJson(".claude-plugin/marketplace.json"),
    readJson("plugins/sprout/.claude-plugin/plugin.json"),
  ]);

  assert.equal(marketplace.name, "sprout");
  assert.equal(marketplace.owner.name, "Sprout");
  assert.equal(marketplace.plugins.length, 1);

  const [entry] = marketplace.plugins;
  assert.equal(entry.name, "sprout-is");
  assert.equal(entry.name, manifest.name);
  assert.equal(entry.source, "./plugins/sprout");
  assert.equal(entry.version, undefined, "plugin.json alone sets the version");
  // Installs from before the rename move to the new name.
  assert.deepEqual(marketplace.renames, { sprout: "sprout-is" });
});

test("the manifest carries the fields the directory listing reads", async () => {
  const manifest = await readJson("plugins/sprout/.claude-plugin/plugin.json");

  assert.equal(manifest.name, "sprout-is");
  assert.equal(manifest.displayName, "Sprout");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.license, "MIT");
  assert.equal(manifest.repository, repository);
  assert.equal(manifest.author.name, "Sprout");
  assert.ok(manifest.description.length > 0);

  for (const field of [
    "homepage",
    "documentationUrl",
    "supportUrl",
    "privacyPolicyUrl",
    "termsOfServiceUrl",
  ]) {
    const url = new URL(manifest[field]);
    assert.equal(url.protocol, "https:", field);
    assert.match(url.hostname, /(^|\.)sprout\.is$/, field);
  }

  assert.match(manifest.icon, /^\.\/assets\/[\w-]+\.png$/);
  const icon = await readFile(path.join(pluginRoot, manifest.icon));
  assert.deepEqual(
    [...icon.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    "the icon is a PNG",
  );
});

test("the connector is the canonical Sprout MCP host", async () => {
  // Claude merges a plugin and a connector only when their URLs match, and
  // sprout.is/connect tells people to add this exact URL.
  assert.deepEqual(await readJson("plugins/sprout/.mcp.json"), {
    mcpServers: {
      sprout: { type: "http", url: "https://mcp.sprout.is" },
    },
  });
});

test("the skill names Sprout's current tools and keeps its safety rules", async () => {
  const skill = await readFile(skillPath, "utf8");
  const { name, description } = frontMatter(skill);

  assert.equal(name, "build-apps");
  assert.ok(description.length > 0 && description.length <= 1024);

  for (const phrase of [
    "`sprout-skill`",
    "`connect_sprout`",
    "`browserPreviewUrl`",
    "**Not live**",
    "does not authorize going live",
    "Never ask for, accept or reveal",
  ]) {
    assert.ok(skill.includes(phrase), `SKILL.md mentions ${phrase}`);
  }

  // Names the OpenCloud plugin's skill still used after the server dropped
  // them, and OpenCloud's own identifiers.
  for (const retired of [
    "get_sprout_session",
    "invoke_dev_function",
    "mutate_dev_data",
    "connect_opencloud",
    "opencloud-skill",
  ]) {
    assert.ok(!skill.includes(retired), `SKILL.md does not mention ${retired}`);
  }

  const tools = skillToolNames(skill);
  for (const core of [
    "list_apps",
    "start_onboarding",
    "validate_draft",
    "verify_dev_session",
    "promote_dev_revision",
    "verify_app",
  ]) {
    assert.ok(tools.includes(core), `SKILL.md uses ${core}`);
  }
});

test("the plugin folder follows the directory's file rules", async () => {
  const files = await pluginFiles();
  assert.ok(files.length <= 512);

  for (const file of files) {
    const relative = path.relative(pluginRoot, file);
    const stats = await lstat(file);
    assert.ok(!stats.isSymbolicLink(), `${relative} is not a symbolic link`);
    assert.match(path.basename(file), /^[\w.-]+$/, relative);
    assert.ok(
      !/^(\.DS_Store|Thumbs\.db|desktop\.ini|__MACOSX)$/.test(path.basename(file)),
      `${relative} is not a system file`,
    );
    if (stats.isFile() && !relative.endsWith(".png")) {
      assert.ok(stats.size < 256 * 1024, `${relative} is under 256 KiB`);
    }
    assert.ok(stats.size < 5 * 1024 * 1024, `${relative} is under 5 MiB`);
  }

  // claude.ai and Cowork refuse a plugin with a top-level bin/ directory.
  assert.ok(!files.includes(path.join(pluginRoot, "bin")));

  const readme = await readFile(path.join(pluginRoot, "README.md"), "utf8");
  const prose = readme.replace(/```[\s\S]*?```/g, "");
  assert.ok(prose.split(/\s+/).filter(Boolean).length >= 40);

  assert.equal(
    await readFile(path.join(pluginRoot, "LICENSE"), "utf8"),
    await readFile(path.join(repositoryRoot, "LICENSE"), "utf8"),
  );
});
