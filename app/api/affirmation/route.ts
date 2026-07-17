import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const body = await req.json();
  const { chapterTitle, commitment } = body;

  const systemPrompt = `You will receive a personal commitment someone wrote for themselves after reading a book chapter. Do two things:

1. Lightly correct any spelling and grammar mistakes in their commitment, without changing their wording, meaning, or voice. Keep it in first person.
2. Write a short, first-person "Lock-In Statement" (2-4 sentences) that affirms this commitment as something they are already becoming — confident, direct, no therapist-speak, no generic motivational fluff.

Return ONLY valid JSON in this exact format, no preamble, no markdown code fences:
{"correctedCommitment": "...", "lockInStatement": "..."}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 400,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Chapter: ${chapterTitle}\n\nMy commitment:\n${commitment}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  let rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";

  rawText = rawText.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { correctedCommitment: commitment, lockInStatement: "" };
  }

  return Response.json(parsed);
}