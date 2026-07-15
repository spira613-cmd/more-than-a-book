import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const body = await req.json();
  const { chapterTitle, chapterSummary, editingLevel } = body;

  const voiceRule = `This must read as the user's own personal journal entry, written in first person ("I noticed...", "I want to...", "This really hit me because..."). It should sound like something they wrote themselves in a reflective, personal moment — not a summary or report about the chapter, and not written about them in third person. Do not describe the chapter or the author in a neutral, reporting tone.`;

  const expandRule = `After the user's own reflection, you MUST add a separate short paragraph (2-4 sentences, clearly set apart, starting with something like "Related to this...") that adds relevant concepts, frameworks, or terminology from THIS SAME BOOK or THIS SAME AUTHOR'S other well-known teachings. If the author or book title is well-known (e.g. a bestselling author like Tony Robbins, James Clear, Brené Brown, etc.), you almost certainly know relevant concepts from their other work — use that knowledge. Do NOT reference other authors, other books, or unrelated frameworks. Do NOT quote or closely paraphrase specific sentences or passages from the book — only reference named concepts/ideas in your own words, the way someone would casually discuss a book's ideas. Only skip this paragraph if the author/book is genuinely obscure or unspecified — for any recognizable author, you must include it.`;

  let systemPrompt: string;
  if (editingLevel === "keep") {
    systemPrompt = `You are an editor, not an author. Proofread the user's chapter reflection for grammar, spelling, punctuation, and formatting only. Preserve their wording, voice, and ideas as much as possible. Do not rewrite unless necessary for clarity. Do not add new ideas or opinions. ${voiceRule} Return only the polished journal entry, no preamble.`;
  } else if (editingLevel === "expand") {
    systemPrompt = `You are an editor, not an author. First, lightly proofread the user's reflection for grammar and clarity, preserving their wording and voice as much as possible. ${voiceRule} Then, ${expandRule} Return only the polished journal entry followed by the related-ideas paragraph, no preamble.`;
  } else {
    systemPrompt = `You are an editor, not an author. Rewrite the user's chapter reflection for better readability and smoother flow. Preserve their ideas and intended meaning exactly. Do not introduce new concepts, opinions, or insights that aren't already theirs. ${voiceRule} Return only the polished journal entry, no preamble.`;
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 800,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Chapter: ${chapterTitle}\n\nMy raw reflection:\n${chapterSummary}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  let rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";

  rawText = rawText.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }

  return Response.json({ journal: rawText });
}