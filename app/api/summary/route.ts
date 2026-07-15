import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const body = await req.json();
  const { chapterTitle, chapterSummary, conversationHistory } = body;

  const systemPrompt = `You are an Implementation Coach creating a final wrap-up document based on a coaching conversation that just took place.

Based on the chapter summary and the full coaching conversation, produce TWO things, clearly separated:

1. An "IMPLEMENTATION SUMMARY" containing these sections, each with a short heading:
- Chapter Takeaway (1-2 sentences)
- Personal Insight (what specifically resonated with this user)
- Commitment (the single most concrete action they landed on — be specific, not vague)
- Obstacle (the main obstacle they identified)
- Strategy (how they plan to handle that obstacle)

2. A "LOCK-IN STATEMENT" — a short, first-person paragraph (3-5 sentences) written as if the user is speaking. It should reinforce their identity and today's decision, using language and specifics from what THEY actually said in the conversation — not generic motivational language. Do not invent commitments they didn't actually make.

Format your response as JSON with exactly this structure, no extra text outside the JSON:
{
  "summary": {
    "chapterTakeaway": "...",
    "personalInsight": "...",
    "commitment": "...",
    "obstacle": "...",
    "strategy": "..."
  },
  "lockInStatement": "..."
}`;

  const conversationText = (conversationHistory || [])
    .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Chapter: ${chapterTitle}\n\nChapter summary: ${chapterSummary}\n\nCoaching conversation:\n${conversationText}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  let rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";

  // Strip markdown code fences if Claude wrapped the JSON in them
  rawText = rawText.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { summary: null, lockInStatement: rawText };
  }

  return Response.json(parsed);
}