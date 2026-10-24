# Sprout for Claude

Sprout is a home for the apps you make: a chore chart for the family, a
sign-up sheet for the club, a shared plan for a weekend away. Describe what
you need to Claude, Claude builds it with Sprout, and it becomes a real app at
its own address that your people can open. Sprout hosts it and keeps it
running.

## What the plugin adds

- **The Sprout connector.** Claude gets Sprout's tools for making,
  previewing, publishing and looking after your apps.
- **Sprout's building guide.** A skill that shows Claude how to work with
  Sprout: try every change in a private preview with made-up data, publish
  only when you ask and the checks pass, and never ask you for a password or
  secret in the chat.

## Get started

1. Install the plugin, then start a new chat.
2. Ask for an app, for example: "Use Sprout to make a chore chart for my
   family."
3. When Claude asks you to sign in, use the Sprout page that opens. New to
   Sprout? The same page creates your account; confirm your email when
   asked.

In Claude Code, install the plugin from inside a session:

```text
/plugin install sprout --marketplace opencloud-ai/sprout-plugins
```

The guide is then also available as `/sprout:build-apps`.

## What it connects to

- **`https://mcp.sprout.is`**, Sprout's hosted connector. You sign in on
  Sprout's own pages at `auth.sprout.is`, so Claude never sees your
  password.
- **Sprout's current instructions** at `https://sprout.is/SKILL.md` and its
  documentation at `https://docs.sprout.is`, which the guide may ask Claude
  to read.
- **The Sprout command-line tool**, in sessions with a terminal such as
  Claude Code. Sprout's instructions have Claude install it with
  `https://sprout.is/install.sh`, which downloads the release from GitHub
  and checks it against its published checksum.

The plugin has no hooks, scripts or programs of its own, and it sends
nothing anywhere else.

## Help and policies

- Support: <https://sprout.is/support>
- Privacy: <https://sprout.is/privacy>
- Terms: <https://sprout.is/terms>

The plugin is available under the [MIT License](LICENSE).
