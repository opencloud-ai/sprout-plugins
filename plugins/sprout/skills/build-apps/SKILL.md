---
name: build-apps
description: Make, change, publish and look after Sprout apps with the Sprout tools. Use when someone asks Claude to build an app with Sprout, change or fix one of their Sprout apps, check how a Sprout app is doing, or connect Sprout.
---

# Build apps with Sprout

Sprout hosts simple web apps for families, clubs and small groups and keeps
them running. This plugin connects Claude to Sprout's hosted tools at
`https://mcp.sprout.is`. The tools, their results and the server's own
instructions are the source of truth. When the client can read MCP resources,
read the `sprout-skill` resource: it is the current, complete version of this
workflow, and it wins wherever it differs from this summary.

Call the product Sprout. App files use internal `opencloud` names, such as
`opencloud.yaml`, `@opencloud/*` packages and the `opencloud` SDK object. Keep
them exactly as they are in files and tool calls, but don't present OpenCloud
to the person as the product.

## Choose how to work

- **A terminal is available** (Claude Code, or Cowork with a shell): read
  `https://sprout.is/SKILL.md` and follow its CLI path. It pins the current
  Sprout CLI release and its checksum-verified installer. Use the CLI even
  when the Sprout tools are also connected, and don't complete the
  connector's sign-in while the CLI works. If the CLI can't be installed or
  run there, use the Sprout tools instead.
- **No terminal** (Claude on the web, desktop or mobile, or Cowork without a
  shell): use the Sprout tools from this plugin.
- **Neither**: a prompt can't add a connector. Tell the person the one setup
  step: turn on the Sprout plugin's connector, or add `https://mcp.sprout.is`
  under **Customize > Connectors** on claude.ai, then start a new chat.

## Talk with the person

Most people using Sprout are not developers. Use plain words, ask one
question at a time and don't repeat questions they've already answered.
Before building, agree on who the app is for, the one main thing it must do,
and whether it is private or public.

## Connect

1. Call `list_apps`, or `get_app` when you know the app. If Sprout asks for
   sign-in, the client shows it and the person completes it there. An empty
   list is fine.
2. For someone new to Sprout, ask once for their email, agree the project
   name and visibility, and call `start_onboarding`. Give them the returned
   `launchUrl` as the main link to follow. After they confirm the email, call
   `complete_onboarding` with the same onboarding ID.
   - Never start a second request for the same email. If
     `verification.emailSent` is false, tell them and call
     `start_onboarding` again shortly with the same details.
   - `onboarding_rate_limited` means they already have several emails: use
     the latest one, or `connect_sprout` for an existing account.
   - If the chat lost its Sprout session after they confirmed, or
     `complete_onboarding` returns `ready` with a null credential, call
     `connect_sprout`.
3. To reconnect an existing account, call `connect_sprout`.
4. `plan_limit_reached` names the limit and may include an `upgradeUrl`.
   Pass both on and continue only after the person acts.

## Build or change an app

1. Call `get_app_starter` with the app ID and every capability the request
   needs: `auth`, `data`, `files`, `functions`, `jobs`, `ai`, `email`,
   `notifications`, `realtime`, `telemetry`, `cron` or `integrations`.
   Implement every `resolvedCapabilities` and `capabilityChecklist` entry,
   and call it again if the plan grows.
2. Call `create_draft`, then `list_files` and `read_files`. A draft starts
   from the live release; keep the work that is already there.
3. Call `apply_file_changes` with the current `expectedRevision` and each
   file's `baseSha256`. Never guess either value. The first batch must
   include `opencloud.yaml` and the frontend.
4. Call `validate_draft` and fix every error. Each diagnostic names a `path`
   and often a `suggestedFix`.
5. Call `start_dev_session` for that validated revision. After each later
   change, validate again and call `apply_dev_revision`.
6. Check the preview with `request_dev_app`. Add made-up test data with
   `create_dev_data_row`, `create_dev_data_rows`, `update_dev_data_row` and
   `delete_dev_data_row`. Use every Function the way the app uses it, then
   check `list_dev_invocations`. For email, use `list_dev_email_captures`,
   `get_dev_email_capture` and `inject_dev_email` with reserved `.test`
   addresses. For notifications, use `list_dev_notification_captures`.
7. When the person wants to look before anything goes live, give them
   `browserPreviewUrl`, never the raw `previewUrl`. It opens the app in a
   window marked **Not live**, with made-up data. If they asked not to
   publish, stop there: a preview does not authorize going live.
8. Call `verify_dev_session` for the exact current revision.

## Publish only what passed

1. Only when the person wants it live, and with a passing receipt, call
   `promote_dev_revision`.
2. Follow the returned operation with `get_operation` until it succeeds,
   fails or is cancelled.
3. Call `verify_app`, then follow `get_verification_run` until every
   required check has finished.
4. Call `get_app`. Give the app's HTTPS address only when the new release is
   active and verification passed.
5. Call `stop_dev_session` once the release has succeeded.

A preview, a queued deployment, elapsed time or a partly finished
verification is not a published app. Never say it is.

## Keep people and their data safe

- Never ask for, accept or reveal a password, email link, code, cookie,
  token, database credential or secret value. Use `generate_secret` for
  values Sprout can create, and `create_secret_entry_link` when the person
  must enter one themselves.
- Dev sessions hold only made-up data. Never read or change the live app to
  work around something the dev session can't do.
- Restore a backup, roll back, delete a secret or domain, or change who can
  use an app only when the person asks for that exact change.
- Work only on apps the signed-in person can open. When Sprout refuses
  access, say so and don't look for another way in.

## When something goes wrong

| What happened                               | What to do                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `expectedRevision` or `baseSha256` conflict | Read the draft and files again and reapply only the intended change.                          |
| `ACTIVE_DEPLOYMENT_CHANGED`                 | Someone published after your copy. Start from the latest release and reapply your change.     |
| Validation diagnostic                       | Fix the named file. Call `get_app_starter` when the manifest or SDK pattern is missing.       |
| Expired or stale receipt                    | Apply the current revision again, repeat the dev checks and verify again.                     |
| Failed operation                            | Report the failure and its diagnostic. Don't publish, and don't say it worked.                |

If work can't continue, say whether the Sprout tools are missing or signed
out, which is a setup step for the person, or Sprout reported a validation or
deployment failure. Then give one clear next step.
