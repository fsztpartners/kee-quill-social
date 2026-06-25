# kee-quill-social

A tiny, focused [eve](https://github.com/vercel-labs/eve) agent, packaged as a
**keemakr Marketplace** entry. It does one thing: take a topic (and an optional
tone) and **draft an on-brand social post** — a hook, a short body, and a few
hashtags.

It's the instant-install demo entry — small enough to read in a minute, with
**zero dependencies**, so installing it for a tenant goes straight to
`installed` with nothing to connect first.

## What's here

| Path | What it is |
| --- | --- |
| `agent/agent.ts` | The single eve root agent (cheap model; just calls `draft_post`). |
| `agent/instructions.md` | How the agent behaves — draft social posts only, nothing else. |
| `agent/tools/draft_post.ts` | The one tool: a pure `topic → drafted post` transform. |
| `agent/channels/eve.ts` | The HTTP entrypoint (dev-login / OIDC). Root-only in eve. |
| `agent/sandbox.ts` | Pinned to `just-bash` — no real shell, no network. |
| `entry.json` | The Marketplace submission (the `EntrySubmission` the platform ingests). |

## The Marketplace entry

`entry.json` is the metadata the keemakr platform's `registerEntry()` reads. It
declares:

- a **department** `marketing` with one **agent** `writer`,
- **no dependencies** (`dependencies: []`).

Because there are no required connections, this is the instant-install demo: when
a tenant installs the entry, the platform resolves dependencies (there are none)
and flips it straight to **`installed`** — the department + agent are seeded and
enabled immediately, no `pending_deps` step. The `draft_post` transform runs
entirely in-process: no tenant, no database, no network.

To exercise the install gate instead, add a required `connection` dependency to
`dependencies` in `entry.json`.

## Develop

```bash
nvm use            # Node >= 24
npm install
npm run dev:eve    # run the eve agent locally
npm run typecheck  # tsc --noEmit
npm run lint
```

Ask it: *"draft a punchy post about shipping on Fridays"* → a hook + body + 2–3
hashtags.

## Capability grant (tenant identity from keemakr)

When the keemakr operator delegates to this agent, it attaches a short-lived
**capability grant** — a signed JWT carrying the verified tenant id and the scopes
the install was granted. This repo verifies that grant against keemakr-core's
published JWKS in [`agent/channels/eve.ts`](agent/channels/eve.ts) via the
`grantAuth()` helper in [`agent/lib/grant-auth.ts`](agent/lib/grant-auth.ts), which
surfaces the tenant + scopes on the session auth context.

The grant is **primary** auth, ahead of the legacy shared secret (which now rides
in its own `x-keemakr-secret` header during the migration window).

Configure it with environment variables on the deployed agent:

| Variable | Purpose |
| --- | --- |
| `KEE_CORE_JWKS_URL` | keemakr-core's JWKS endpoint, e.g. `https://app.keemakr.com/.well-known/jwks.json`. If unset, the grant path is off and only dev-login / OIDC / the shared secret apply. |
| `KEE_AGENT_AUDIENCE` | This deployment's audience — its public origin — matching the `aud` the operator mints. |
| `KEE_QUILL_SOCIAL_INBOUND_SECRET` | Optional legacy shared secret (fallback only; being retired). |

> The `grant-auth.ts` helper is the same one published as
> [`@keemakr/agent-sdk`](https://www.npmjs.com/package/@keemakr/agent-sdk)
> (`import { grantAuth } from "@keemakr/agent-sdk"`). It is vendored here for now
> and will be replaced by the package import.
