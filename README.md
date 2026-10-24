# Sprout plugins

The Sprout plugin for Claude Code, Cowork and Claude chat. It bundles
Sprout's hosted connector, `https://mcp.sprout.is`, with a skill that guides
Claude through Sprout's build, preview and publish steps. The plugin itself
is in [`plugins/sprout`](plugins/sprout); its README is what people see when
they browse the plugin.

## Install in Claude Code

```bash
claude plugin marketplace add opencloud-ai/sprout-plugins
claude plugin install sprout@sprout
```

On Claude Code 2.1.275 or later, one command in a session does both:
`/plugin install sprout --marketplace opencloud-ai/sprout-plugins`.

Start a new session or run `/reload-plugins`. The skill runs by itself for
matching requests and is also available as `/sprout:build-apps`. Sessions
with a terminal follow Sprout's CLI path; the connector is for sessions
without one, and its sign-in is under `/mcp`.

## Claude on the web, desktop and mobile

Add `opencloud-ai/sprout-plugins` as a marketplace under **Customize >
Plugins** on claude.ai and install **Sprout**. The plugin brings the skill
and lists the connector on its **Connectors** tab, where you connect it.
Plugins installed on claude.ai also reach Claude Code as `sprout@synced`.

Without the plugin, people can still add `https://mcp.sprout.is` under
**Customize > Connectors**. They then get Sprout's tools without the skill.

## Layout

```text
.claude-plugin/marketplace.json   The "sprout" marketplace
plugins/sprout/                   The plugin
  .claude-plugin/plugin.json      Manifest and directory listing fields
  .mcp.json                       The hosted Sprout connector
  skills/build-apps/SKILL.md      Workflow and safety guide for Claude
  assets/icon.png                 Listing icon
scripts/                          Package tests and the live tool check
```

## Check a change

```bash
npm test
npm run validate
npm run check:live
```

`npm test` checks the manifests, the skill and the package rules of
Anthropic's plugin directory. `npm run validate` runs Claude Code's strict
validator on the plugin and the marketplace. `npm run check:live` opens an
anonymous MCP session on `https://mcp.sprout.is` and confirms that every tool
the skill names, and the `sprout-skill` resource, still exist. CI runs all
three on pull requests and once a week.

To try a local copy before you push:

```bash
claude plugin marketplace add ./
claude plugin install sprout@sprout
```

## Release

1. Raise `version` in `plugins/sprout/.claude-plugin/plugin.json`. Claude
   Code installs a new copy only when it changes.
2. Merge to `main`, then tag the merge commit `vX.Y.Z`.

## Support and policies

See [Sprout support](https://sprout.is/support), the
[privacy policy](https://sprout.is/privacy) and the
[terms](https://sprout.is/terms). Report security problems privately as
[SECURITY.md](SECURITY.md) describes.

Available under the [MIT License](LICENSE).
