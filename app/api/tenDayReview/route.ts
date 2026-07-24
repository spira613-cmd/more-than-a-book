import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, userEmail } = body;

  if (!userId || !userEmail) {
    return Response.json({ error: "Missing userId or userEmail" }, { status: 400 });
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("chapter_title, journal, chapter_summary, commitment, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!chapters || chapters.length === 0) {
    return Response.json({ error: "No entries found" }, { status: 400 });
  }

  const entriesText = chapters
    .map((c, i) => {
      const parts = [`Entry ${i + 1}: ${c.chapter_title || "Untitled Chapter"}`];
      const reflection = c.journal || c.chapter_summary;
      if (reflection) parts.push(`Reflection: ${reflection}`);
      if (c.commitment) parts.push(`Commitment: ${c.commitment}`);
      return parts.join("\n");
    })
    .join("\n\n");

  const systemPrompt = `You are a thoughtful, perceptive guide reviewing someone's first ten days of personal reflections from a self-development app. You will be given their own journal entries and commitments, in order.

Based ONLY on what they actually wrote, identify:

1. 2-3 recurring themes or values that genuinely show up across their OWN words — not generic self-help themes, but things specific to what THEY kept returning to. Reference actual specifics from their entries, not vague generalities.
2. One honest "growing edge" — something they themselves named as a struggle, obstacle, fear, or an idea/action they mentioned wanting to do but haven't yet followed through on. Be honest and direct about it, not falsely encouraging or softened into mush, but still warm and non-judgmental — like a mentor who actually paid attention, not a fortune cookie.

Write each theme and the growing edge as 1-2 sentences, in second person ("You keep coming back to...", "One thing I noticed..."), addressed directly to them. Avoid therapist-speak, generic motivational language, and vague praise. If the entries are too thin to find a genuine pattern, say so honestly rather than inventing one.

Return ONLY valid JSON, no markdown code fences, no preamble, in exactly this format:
{"themes": ["...", "...", "..."], "growingEdge": "..."}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 700,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Here are this person's first ten entries, in order:\n\n${entriesText}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  let rawText = textBlock && "text" in textBlock ? textBlock.text : "{}";

  rawText = rawText.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }

  let parsed: { themes?: string[]; growingEdge?: string };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { themes: [], growingEdge: "" };
  }

  const themes = Array.isArray(parsed.themes) ? parsed.themes : [];
  const growingEdge = parsed.growingEdge || "";

  const themesHtml = themes
    .map((t) => `<li style="margin-bottom: 12px; line-height: 1.6;">${t}</li>`)
    .join("");

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
      <p>Hey,</p>
      <p>Ten days in. Ten chapters read, reflected on, and turned toward action. That's not nothing — most people don't make it past day one.</p>
      <p>I went back through everything you've written so far. A few things kept showing up:</p>

      <ul style="padding-left: 20px; margin-top: 16px;">
        ${themesHtml}
      </ul>

      <p style="margin-top: 32px;">And here's something worth sitting with honestly, not just hearing:</p>
      <div style="margin-top: 12px; padding: 16px; background: #fffdf7; border-radius: 8px; line-height: 1.6;">
        ${growingEdge}
      </div>

      <p style="margin-top: 32px;">Five more days to day 15. Keep showing up — you're building something real, one reflection at a time.</p>
      <p>Simcha Spira<br/>Founder, More Than A Book</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "More Than A Book <onboarding@resend.dev>",
      to: userEmail,
      subject: "Day 10 — here's what I'm noticing",
      html,
    });

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("Ten-day review email error:", err);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }
}
