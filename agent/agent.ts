import { defineAgent } from "eve";
import { anthropic } from "@ai-sdk/anthropic";

// kee-quill-social — a tiny, focused eve agent that drafts social posts.
//
// eve allows exactly ONE root agent per project (agent/agent.ts). This is it:
// a single agent with one tool (`draft_post`) that performs a deterministic
// transform — turn a topic (and optional tone) into a ready-to-post draft with a
// hook, body, and a few hashtags. There are no departments, no subagents, no
// database. It exists to be a minimal, end-to-end keemakr Marketplace entry:
// something small enough to read in a minute that still exercises the full
// register → resolve-dependencies → install round-trip. It declares NO
// dependencies (see entry.json), so it installs instantly.
//
// Model routing mirrors the platform convention: the Vercel AI Gateway string in
// production (needs AI_GATEWAY_API_KEY), the direct Anthropic provider in local
// dev. The model just decides to call `draft_post` and relays the result, so it's
// the cheap tier.
export default defineAgent({
  model: process.env.AI_GATEWAY_API_KEY
    ? "anthropic/claude-haiku-4.5"
    : anthropic("claude-haiku-4-5-20251001"),
});
