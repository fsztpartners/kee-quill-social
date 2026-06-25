import { defineTool } from "eve/tools";
import { z } from "zod";

// The one tool. A pure, deterministic transform: topic (+ optional tone) → a
// drafted social post made of a hook, a short body, and a few hashtags.
//
// No tenant, no database, no network — the whole point is to be the smallest
// thing that still proves the agent runs end-to-end. This entry declares NO
// dependencies (see entry.json), so it installs instantly — there is no install
// gate to exercise here, just the agent itself.

const TONES = {
  punchy: { opener: "Hot take:", closer: "Let's go. 🚀" },
  professional: { opener: "A quick thought on", closer: "Curious to hear your take." },
  playful: { opener: "Okay but real talk —", closer: "Who's with me? 😄" },
  inspirational: { opener: "Reminder:", closer: "Keep building. ✨" },
} as const;

type Tone = keyof typeof TONES;

function toHashtag(word: string): string {
  const cleaned = word.replace(/[^a-zA-Z0-9]/g, "");
  if (!cleaned) return "";
  return "#" + cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function hashtagsFor(topic: string): string[] {
  const stop = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "to",
    "for",
    "in",
    "on",
    "with",
    "your",
    "our",
    "is",
    "are",
  ]);
  const tags = topic
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !stop.has(w.toLowerCase()))
    .map(toHashtag)
    .filter(Boolean);
  // Always include a generic anchor tag, dedupe, keep 2–3.
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of [...tags, "#SocialMedia"]) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(t);
    if (result.length === 3) break;
  }
  return result.length >= 2 ? result : [...result, "#Content"].slice(0, 2);
}

export default defineTool({
  description:
    "Drafts an on-brand social post from a topic. Builds a hook, a short body, and 2–3 hashtags derived from the topic; an optional tone (punchy, professional, playful, inspirational) shapes the wording. Use this for any 'draft / write / compose a social post' request.",
  inputSchema: z.object({
    topic: z
      .string()
      .min(1)
      .max(280)
      .describe("What the post should be about."),
    tone: z
      .enum(["punchy", "professional", "playful", "inspirational"])
      .optional()
      .describe("Optional voice for the post. Defaults to punchy."),
  }),
  execute: async (input) => {
    const tone: Tone = input.tone ?? "punchy";
    const { opener, closer } = TONES[tone];
    const topic = input.topic.trim();

    const hook = `${opener} ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
    const body = `Here's why ${topic} matters right now — and how you can make the most of it. ${closer}`;
    const hashtags = hashtagsFor(topic);

    const post = `${hook}\n\n${body}\n\n${hashtags.join(" ")}`;

    return { post, tone, hook, body, hashtags, length: post.length };
  },
});
