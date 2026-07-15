"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type SummaryData = {
  chapterTakeaway: string;
  personalInsight: string;
  commitment: string;
  obstacle: string;
  strategy: string;
};

type Screen = "form" | "journalChoice" | "journalDisplay" | "coaching" | "summary";

export default function Home() {
  const [chapterTitle, setChapterTitle] = useState("");
  const [summaryInput, setSummaryInput] = useState("");
  const [quotesInput, setQuotesInput] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [screen, setScreen] = useState<Screen>("form");
  const [journal, setJournal] = useState("");
  const [journalLoading, setJournalLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [userReply, setUserReply] = useState("");
  const [loading, setLoading] = useState(false);

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [lockInStatement, setLockInStatement] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  function buildChapterSummary() {
    const parts = [];
    if (summaryInput.trim()) parts.push(`Summary: ${summaryInput.trim()}`);
    if (quotesInput.trim()) parts.push(`Quotes & Stories: ${quotesInput.trim()}`);
    if (actionInput.trim()) parts.push(`Action Steps & Questions: ${actionInput.trim()}`);
    return parts.join("\n\n");
  }

async function generateJournal(editingLevel: "keep" | "flow" | "expand") {
    setJournalLoading(true);
    setScreen("journalDisplay");

    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterTitle,
        chapterSummary: buildChapterSummary(),
        editingLevel,
      }),
    });

    const data = await res.json();
    setJournal(data.journal);
    setJournalLoading(false);
  }

  async function startCoaching() {
    setLoading(true);
    setScreen("coaching");

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterTitle,
        chapterSummary: buildChapterSummary(),
        conversationHistory: [],
      }),
    });

    const data = await res.json();
    setMessages([{ role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  async function sendReply() {
    if (!userReply.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userReply },
    ];
    setMessages(newMessages);
    setUserReply("");
    setLoading(true);

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterTitle,
        chapterSummary: buildChapterSummary(),
        conversationHistory: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  async function wrapUp() {
    setSummaryLoading(true);
    setScreen("summary");

    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterTitle,
        chapterSummary: buildChapterSummary(),
        conversationHistory: messages,
      }),
    });

    const data = await res.json();
    setSummaryData(data.summary);
    setLockInStatement(data.lockInStatement);
    setSummaryLoading(false);

    if (data.summary) {
      await supabase.from("chapters").insert({
        chapter_title: chapterTitle,
        chapter_summary: buildChapterSummary(),
        journal: journal,
        conversation: messages,
        chapter_takeaway: data.summary.chapterTakeaway,
        personal_insight: data.summary.personalInsight,
        commitment: data.summary.commitment,
        obstacle: data.summary.obstacle,
        strategy: data.summary.strategy,
        lock_in_statement: data.lockInStatement,
      });
    }
  }

  if (screen === "form") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8">
          <div className="flex justify-end gap-4 mb-2">
            <a href="/journal" className="text-sm text-gray-500 underline">
              View My Journal →
            </a>
            <a href="/checkin" className="text-sm text-gray-500 underline">
              View My Commitments →
            </a>
          </div>

          <h1 className="text-2xl font-semibold mb-2">Start a New Chapter</h1>
          <p className="text-gray-500 mb-6">
            Enter the book/chapter you just read and a short summary of what stood out to you.
          </p>

          <label className="block text-sm font-medium mb-1">Chapter Title</label>
          <input
            className="w-full border rounded-lg p-3 mb-4"
            placeholder="e.g. Atomic Habits — Chapter 3"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
          />

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">📝 Summary</label>
            <p className="text-xs text-gray-500 mb-2">
              What was this chapter about? What were the biggest ideas?
            </p>
            <textarea
              className="w-full border rounded-lg p-3 h-24"
              placeholder="Start typing or use voice-to-text..."
              value={summaryInput}
              onChange={(e) => setSummaryInput(e.target.value)}
              spellCheck={true}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              💬 Quotes & Stories
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Any meaningful quotes or stories you want to remember?
            </p>
            <textarea
              className="w-full border rounded-lg p-3 h-24"
              placeholder="Start typing or use voice-to-text..."
              value={quotesInput}
              onChange={(e) => setQuotesInput(e.target.value)}
              spellCheck={true}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ✅ Action & Questions
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Any action steps, exercises, or questions the author says to ask yourself?
            </p>
            <textarea
              className="w-full border rounded-lg p-3 h-24"
              placeholder="Start typing or use voice-to-text..."
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              spellCheck={true}
            />
          </div>

          <p className="text-xs text-gray-400 mb-4">
            💡 Tip: press <span className="font-medium">Windows key + H</span> to use
            voice-to-text instead of typing.
          </p>

          <button
            onClick={() => setScreen("journalChoice")}
            className="w-full bg-black text-white rounded-lg py-3 font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (screen === "journalChoice") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">Great job!</h1>
          <p className="text-gray-500 mb-8">
            You've captured the key ideas from this chapter. How would you like me to polish
            your journal?
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => generateJournal("keep")}
              className="border rounded-xl p-5 text-left hover:bg-gray-50"
            >
              <div className="font-semibold mb-1">Keep It Yours</div>
              <div className="text-sm text-gray-500">
                Just proofread grammar and formatting. Your words, your voice.
              </div>
            </button>

            <button
              onClick={() => generateJournal("flow")}
              className="border rounded-xl p-5 text-left hover:bg-gray-50"
            >
              <div className="font-semibold mb-1">Make It Flow</div>
              <div className="text-sm text-gray-500">
                Rewrite for smoother readability, same ideas and meaning.
              </div>
            </button>

            <button
              onClick={() => generateJournal("expand")}
              className="border rounded-xl p-5 text-left hover:bg-gray-50"
            >
              <div className="font-semibold mb-1">Add Context</div>
              <div className="text-sm text-gray-500">
                Includes related ideas from this book or author, where relevant.
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "journalDisplay") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8">
          <h1 className="text-xl font-semibold mb-4">{chapterTitle}</h1>

          {journalLoading ? (
            <p className="text-gray-400 italic mb-6">Polishing your journal...</p>
          ) : (
            <p className="whitespace-pre-wrap text-gray-800 mb-8 leading-relaxed">{journal}</p>
          )}

          {!journalLoading && (
            <>
              <p className="font-medium mb-4">What would you like to do next?</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setScreen("journalChoice")}
                  className="w-full border rounded-lg py-3 font-medium"
                >
                  📖 Review My Journal (redo polish)
                </button>
                <button
                  onClick={startCoaching}
                  className="w-full bg-black text-white rounded-lg py-3 font-medium"
                >
                  🧠 Build an Action Plan
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (screen === "coaching") {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gray-50 p-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8 flex flex-col gap-4">
          <h1 className="text-xl font-semibold">{chapterTitle}</h1>

          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "assistant"
                    ? "bg-gray-100 rounded-lg p-3 text-gray-800"
                    : "bg-black text-white rounded-lg p-3 self-end"
                }
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-100 rounded-lg p-3 text-gray-400 italic">
                Thinking...
              </div>
            )}
          </div>

          <textarea
            className="w-full border rounded-lg p-3 h-24"
            placeholder="Type your answer, or press Windows key + H for voice-to-text..."
            value={userReply}
            onChange={(e) => setUserReply(e.target.value)}
          />

          <button
            onClick={sendReply}
            disabled={loading || !userReply.trim()}
            className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-40"
          >
            Send
          </button>

          <button
            onClick={wrapUp}
            disabled={loading || messages.length < 2}
            className="w-full border rounded-lg py-3 font-medium disabled:opacity-40"
          >
            Wrap Up & Get My Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8">
        <h1 className="text-xl font-semibold mb-6">{chapterTitle}</h1>

        {summaryLoading ? (
          <p className="text-gray-400 italic">Putting together your summary...</p>
        ) : (
          <>
            {summaryData && (
              <div className="flex flex-col gap-5 mb-8">
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">CHAPTER TAKEAWAY</div>
                  <p className="text-gray-800">{summaryData.chapterTakeaway}</p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">PERSONAL INSIGHT</div>
                  <p className="text-gray-800">{summaryData.personalInsight}</p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">COMMITMENT</div>
                  <p className="text-gray-800">{summaryData.commitment}</p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">OBSTACLE</div>
                  <p className="text-gray-800">{summaryData.obstacle}</p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">STRATEGY</div>
                  <p className="text-gray-800">{summaryData.strategy}</p>
                </div>
              </div>
            )}

            {lockInStatement && (
              <div className="bg-gray-900 text-white rounded-xl p-6 italic leading-relaxed">
                {lockInStatement}
              </div>
            )}

            <button
              onClick={() => {
                setChapterTitle("");
                setSummaryInput("");
                setQuotesInput("");
                setActionInput("");
                setJournal("");
                setMessages([]);
                setSummaryData(null);
                setLockInStatement("");
                setScreen("form");
              }}
              className="w-full mt-6 border rounded-lg py-3 font-medium"
            >
              Start Another Chapter
            </button>
          </>
        )}
      </div>
    </div>
  );
}