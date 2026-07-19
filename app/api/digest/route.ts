import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, userEmail } = body;

  if (!userId || !userEmail) {
    return Response.json({ error: "Missing userId or userEmail" }, { status: 400 });
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("chapter_title, journal, commitment, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(5);

  if (!chapters || chapters.length === 0) {
    return Response.json({ error: "No entries found" }, { status: 400 });
  }

  const journalSection = chapters
    .map((c, i) => {
      const date = new Date(c.created_at).toLocaleDateString();
      return `<div style="margin-bottom: 24px; padding: 16px; background: #fffdf7; border-radius: 8px;">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">Day ${i + 1} — ${date}</div>
        <div style="font-weight: 600; margin-bottom: 8px;">${c.chapter_title || "Untitled Chapter"}</div>
        <div style="white-space: pre-wrap; line-height: 1.6;">${c.journal || ""}</div>
      </div>`;
    })
    .join("");

  const commitmentsSection = chapters
    .filter((c) => c.commitment)
    .map((c) => `<li style="margin-bottom: 8px;">${c.commitment}</li>`)
    .join("");

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
      <p>Hey,</p>
      <p>This is a personal note from me, Simcha Spira, founder of More Than A Book. That's right—this part isn't AI-generated.</p>
      <p>I'm writing because you showed up for five days. You didn't just read—you stopped, reflected, captured what mattered, and worked to turn it into action.</p>
      <p>Here's something worth remembering: you don't need to hold onto an entire chapter. One real takeaway — one idea you actually apply — already puts you ahead of almost everyone else reading self-help books right now. Most people finish a book and remember the cover. You're building something different.</p>
      <p>Research shows that actively recalling what you learn, rather than simply rereading it, strengthens long-term retention. You're on your way.</p>
      <p>I'm honored that you've chosen to use More Than A Book as part of that process.</p>
      <p>Below are your last five journal entries. Take a few minutes to read them and see how much you've already captured.</p>

      <h3 style="margin-top: 32px;">Your Journal Entries</h3>
      ${journalSection}

      ${commitmentsSection ? `<h3 style="margin-top: 32px;">Your Commitments</h3><ul>${commitmentsSection}</ul>` : ""}

      <p style="margin-top: 32px;">My blessing to you is simple: keep reading, keep reflecting, and most importantly, keep becoming.</p>
      <p>Simcha Spira<br/>Founder, More Than A Book</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "More Than A Book <onboarding@resend.dev>",
      to: userEmail,
      subject: "Your first 5 days — a note from the founder",
      html,
    });

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("Digest email error:", err);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }
}