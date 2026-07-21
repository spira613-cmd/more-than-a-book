"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ReflectionField = "remember" | "stoodOut" | "stopThink" | "actionSuggested" | "extra";

type SummaryData = {
  chapterTakeaway: string;
  personalInsight: string;
  commitment: string;
  obstacle: string;
  strategy: string;
};

type ChapterEntry = {
  id: number;
  created_at: string;
};

type Screen = "spiral" | "form" | "journalChoice" | "journalDisplay" | "coaching" | "summary" | "selfDeclared";

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [entries, setEntries] = useState<ChapterEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      } else {
        setUserId(data.session.user.id);
        setUserEmail(data.session.user.email || null);
        setAuthChecked(true);
        loadEntries(data.session.user.id);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("screen") === "form") {
            setScreen("form");
          }
        }
      }
    });
  }, [router]);

  async function loadEntries(uid: string) {
    setEntriesLoading(true);
    const { data } = await supabase
      .from("chapters")
      .select("id, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    setEntries(data || []);
    setEntriesLoading(false);
  }

  const [chapterTitle, setChapterTitle] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("draft_chapterTitle") || "";
  });
  const [rememberInput, setRememberInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("draft_remember") || "";
  });
  const [stoodOutInput, setStoodOutInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("draft_stoodOut") || "";
  });
  const [stopThinkInput, setStopThinkInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("draft_stopThink") || "";
  });
  const [actionSuggestedInput, setActionSuggestedInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("draft_actionSuggested") || "";
  });
  const [extraInput, setExtraInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("draft_extra") || "";
  });
  const [showExtraBox, setShowExtraBox] = useState(false);
  const [activeField, setActiveField] = useState<ReflectionField>("remember");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const activeFieldRef = useRef<ReflectionField>("remember");
  const sessionBaseRef = useRef<string>("");
  const [screen, setScreen] = useState<Screen>("spiral");
  const [journal, setJournal] = useState("");
  const [journalLoading, setJournalLoading] = useState(false);
  const [selfCommitment, setSelfCommitment] = useState("");
  const [selfSaving, setSelfSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("draft_chapterTitle", chapterTitle);
  }, [chapterTitle]);

  // One-time migration: carry over any in-progress draft from the old two-box
  // layout so switching to the four-box layout doesn't silently lose it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const oldSummary = localStorage.getItem("draft_summaryInput");
    const oldAction = localStorage.getItem("draft_actionInput");
    if (oldSummary && !localStorage.getItem("draft_remember")) {
      setRememberInput(oldSummary);
    }
    if (oldAction && !localStorage.getItem("draft_actionSuggested")) {
      setActionSuggestedInput(oldAction);
    }
    if (oldSummary || oldAction) {
      localStorage.removeItem("draft_summaryInput");
      localStorage.removeItem("draft_actionInput");
    }
  }, []);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("draft_remember", rememberInput);
  }, [rememberInput]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("draft_stoodOut", stoodOutInput);
  }, [stoodOutInput]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("draft_stopThink", stopThinkInput);
  }, [stopThinkInput]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("draft_actionSuggested", actionSuggestedInput);
  }, [actionSuggestedInput]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("draft_extra", extraInput);
  }, [extraInput]);

  function playChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const startTime = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (e) {
      // audio not supported, fail silently
    }
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [userReply, setUserReply] = useState("");
  const [loading, setLoading] = useState(false);

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [lockInStatement, setLockInStatement] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  function buildChapterSummary() {
    const parts = [
      rememberInput.trim(),
      stoodOutInput.trim(),
      stopThinkInput.trim(),
      actionSuggestedInput.trim(),
      extraInput.trim(),
    ].filter(Boolean);
    return parts.join("\n\n");
  }

  function getFieldSetter(field: ReflectionField): (value: string) => void {
    const setters: Record<ReflectionField, (value: string) => void> = {
      remember: setRememberInput,
      stoodOut: setStoodOutInput,
      stopThink: setStopThinkInput,
      actionSuggested: setActionSuggestedInput,
      extra: setExtraInput,
    };
    return setters[field];
  }

  function getFieldValue(field: ReflectionField): string {
    const values: Record<ReflectionField, string> = {
      remember: rememberInput,
      stoodOut: stoodOutInput,
      stopThink: stopThinkInput,
      actionSuggested: actionSuggestedInput,
      extra: extraInput,
    };
    return values[field];
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      return;
    }

    activeFieldRef.current = activeField;
    if (activeField === "extra") setShowExtraBox(true);
    sessionBaseRef.current = getFieldValue(activeField).trim();

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcript = transcript.replace(/\s+/g, " ").trim();

      const base = sessionBaseRef.current;
      const combined = base ? (transcript ? `${base} ${transcript}` : base) : transcript;
      getFieldSetter(activeFieldRef.current)(combined);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  async function generateJournal(editingLevel: "keep" | "flow" | "expand") {
    setJournalLoading(true);
    setScreen("journalDisplay");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterTitle,
          chapterSummary: buildChapterSummary(),
          editingLevel,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      setJournal(
        data.error ||
          data.journal ||
          "Something went wrong — please try again."
      );
      if (!data.error) playChime();
    } catch (err) {
      console.error("generateJournal failed:", err);
      setJournal(
        "This is taking longer than expected. Please try again — your draft is saved, nothing is lost."
      );
    } finally {
      setJournalLoading(false);
    }
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
    setMessages([{ role: "assistant", content: data.error || data.reply }]);
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
    setMessages([...newMessages, { role: "assistant", content: data.error || data.reply }]);
    setLoading(false);
  }
async function checkAndSendDigest() {
    if (!userId || !userEmail) return;
    const { count } = await supabase
      .from("chapters")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (count === 5) {
      fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userEmail }),
      }).catch((err) => console.error("Digest trigger failed:", err));
    }
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
        user_id: userId,
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
      checkAndSendDigest();
    }
  }
    
  

  async function saveSelfDeclared() {
    if (!selfCommitment.trim()) return;
    setSelfSaving(true);

    const res = await fetch("/api/affirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterTitle,
        commitment: selfCommitment.trim(),
      }),
    });

    const data = await res.json();

    await supabase.from("chapters").insert({
      user_id: userId,
      chapter_title: chapterTitle,
      chapter_summary: buildChapterSummary(),
      journal: journal,
      conversation: [],
      chapter_takeaway: "",
      personal_insight: "",
      commitment: data.correctedCommitment || selfCommitment.trim(),
      obstacle: "",
      strategy: "",
      lock_in_statement: data.lockInStatement,
    });
checkAndSendDigest();
    setSelfSaving(false);
    window.location.href = "/checkin";
  }

  if (!authChecked || entriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 italic">Loading...</p>
      </div>
    );
  }

 if (screen === "spiral") {
    const completedCount = entries.length;
    const nextDayNumber = completedCount + 1;
    const totalSlots = 15;
    const milestoneDays: Record<number, string> = {
      1: "You started!",
      5: "Your 5-day email",
      10: "Your 10-day assessment",
      15: "Share with a friend",
    };

    return (
      <div className="flex min-h-screen flex-col items-center bg-gray-50 p-6">
        <div className="w-full max-w-2xl">
          <div className="flex justify-end gap-4 mb-4">
            <a href="/journal" className="text-sm text-gray-500 underline">
              View My Journal →
            </a>
            <a href="/checkin" className="text-sm text-gray-500 underline">
              View My Commitments →
            </a>
          </div>

          <p className="text-center text-xs uppercase tracking-wide text-gray-400 mb-1">
            More Than A Book
          </p>
          <h1 className="text-center text-2xl font-semibold mb-8">Your journey</h1>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-6 mb-8 justify-items-center">
            {Array.from({ length: totalSlots }, (_, i) => i + 1).map((dayNum) => {
              const isCompleted = dayNum <= completedCount;
              const isNext = dayNum === nextDayNumber;
              const milestoneLabel = milestoneDays[dayNum];

              let circle;
              if (isCompleted) {
                circle = (
                  <a
                    href="/checkin"
                    className="w-16 h-16 rounded-full bg-teal-100 border border-teal-300 flex flex-col items-center justify-center hover:bg-teal-200 transition"
                  >
                    <span className="text-[10px] text-teal-700">DAY</span>
                    <span className="text-lg font-semibold text-teal-800">
                      {String(dayNum).padStart(2, "0")}
                    </span>
                  </a>
                );
              } else if (isNext) {
                circle =
                  dayNum === 1 ? (
                    <a
                      href="/?screen=form"
                      className="w-16 h-16 rounded-full bg-black text-white flex flex-col items-center justify-center hover:bg-gray-800 transition shadow-lg"
                    >
                      <span className="text-[10px]">DAY</span>
                      <span className="text-lg font-semibold">01</span>
                    </a>
                  ) : (
                    <a
                      href="/checkin"
                      className="w-16 h-16 rounded-full bg-black text-white flex flex-col items-center justify-center hover:bg-gray-800 transition shadow-lg text-center"
                    >
                      <span className="text-[9px] leading-tight px-1">Check In</span>
                      <span className="text-[9px] leading-tight px-1">& Continue</span>
                    </a>
                  );
              } else {
                circle = (
                  <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex flex-col items-center justify-center opacity-60">
                    <span className="text-[9px] text-gray-400">DAY</span>
                    <span className="text-base font-medium text-gray-400">
                      {String(dayNum).padStart(2, "0")}
                    </span>
                  </div>
                );
              }

              return (
                <div key={dayNum} className="flex flex-col items-center gap-1.5 w-20">
                  {circle}
                  {milestoneLabel && (
                    <span
                      className={
                        "text-[11px] text-center font-medium leading-tight " +
                        (isCompleted || isNext ? "text-amber-600" : "text-gray-400")
                      }
                    >
                      ⭐ {milestoneLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm font-medium mb-1">
            {nextDayNumber === 1
              ? "Tap Day 01 to write your first entry"
              : 'Tap "Check In & Continue" to see your commitments and write today\'s entry'}npm run dev
          </p>
          <p className="text-center text-xs text-gray-400">
            {completedCount} {completedCount === 1 ? "day" : "days"} written so far
          </p>
        </div>
      </div>
    );
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
            className="w-full border rounded-lg p-3 mb-4 text-gray-900"
            placeholder="e.g. Atomic Habits — Chapter 3"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
          />

          <div className="mb-1">
            <p className="text-sm font-semibold text-gray-700 mb-0.5">
              Before the chapter fades, capture what you remember.
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Answer whatever comes to mind. A sentence is enough.
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-2">
            {(
              [
                { field: "remember" as const, label: "What do you remember?", placeholder: "Just a sentence or two...", value: rememberInput, setValue: setRememberInput },
                { field: "stoodOut" as const, label: "What stood out?", placeholder: "An idea, story, example, quote...", value: stoodOutInput, setValue: setStoodOutInput },
                { field: "stopThink" as const, label: "Made you stop and think?", placeholder: "Something surprising, challenging...", value: stopThinkInput, setValue: setStopThinkInput },
                { field: "actionSuggested" as const, label: "Did the author suggest trying anything?", placeholder: "Something specific they said to do or try...", value: actionSuggestedInput, setValue: setActionSuggestedInput },
              ]
            ).map(({ field, label, placeholder, value, setValue }) => (
              <div
                key={field}
                className={
                  "border rounded-lg p-3 " +
                  (activeField === field ? "border-black" : "border-gray-300")
                }
              >
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <textarea
                  className="w-full resize-none text-sm outline-none overflow-hidden min-h-28 text-gray-900"
                  rows={4}
                  placeholder={placeholder}
                  value={value}
                  onFocus={() => setActiveField(field)}
                  onChange={(e) => {
                    setValue(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  spellCheck={true}
                />
              </div>
            ))}
          </div>

          {!showExtraBox ? (
            <button
              type="button"
              onClick={() => setShowExtraBox(true)}
              className="text-xs text-gray-500 underline mb-3"
            >
              + Anything else?
            </button>
          ) : (
            <div
              className={
                "border rounded-lg p-3 mb-3 " +
                (activeField === "extra" ? "border-black" : "border-gray-300")
              }
            >
              <label className="block text-xs font-semibold text-gray-600 mb-1">Anything else</label>
              <textarea
                className="w-full resize-none text-sm outline-none overflow-hidden text-gray-900"
                rows={2}
                placeholder="Anything else you don't want to forget..."
                value={extraInput}
                onFocus={() => setActiveField("extra")}
                onChange={(e) => {
                  setExtraInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                spellCheck={true}
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-1 mb-4">
            {speechSupported ? (
              <>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white " +
                    (isListening ? "bg-red-600" : "bg-black")
                  }
                >
                  {isListening ? "● Listening..." : "🎙️ Speak My Thoughts"}
                </button>
                <p className="text-[11px] text-gray-400 text-center">
                  {isListening
                    ? "Tap again to stop — adds to what you've already typed."
                    : "Tap a box, then tap to speak into it."}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400 text-center">
                Voice input isn't available in this browser — no problem, just type your thoughts below.
              </p>
            )}
          </div>

          <p className="font-medium mb-3">How would you like me to polish your journal?</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => generateJournal("keep")}
              className="w-full border rounded-lg py-3 font-medium text-left px-4"
            >
              <div className="font-semibold">Keep It Yours</div>
              <div className="text-sm text-gray-500">Just proofread grammar and formatting.</div>
            </button>
            <button
              onClick={() => generateJournal("flow")}
              className="w-full border rounded-lg py-3 font-medium text-left px-4"
            >
              <div className="font-semibold">Make It Flow</div>
              <div className="text-sm text-gray-500">Rewrite for smoother readability.</div>
            </button>
            <button
              onClick={() => generateJournal("expand")}
              className="w-full bg-black text-white rounded-lg py-3 font-medium text-left px-4"
            >
              <div className="font-semibold">Add Context</div>
              <div className="text-sm text-gray-200">Includes related ideas from this book or author.</div>
            </button>
          </div>
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
            <>
              <div className="text-center mb-4">
                <span className="text-3xl">🎉</span>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  Nice work — you showed up for yourself today.
                </p>
              </div>
              <p className="whitespace-pre-wrap text-gray-800 mb-8 leading-relaxed">{journal}</p>
            </>
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
                  🧠 Help me create an action
                </button>
                <button
                  onClick={() => setScreen("selfDeclared")}
                  className="w-full border rounded-lg py-3 font-medium"
                >
                  ✅ I already have one in mind
                </button>
                <a
                  href="/journal"
                  className="w-full text-center border rounded-lg py-3 font-medium text-gray-600"
                >
                  ✔️ Done for today
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (screen === "selfDeclared") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8">
          <h1 className="text-xl font-semibold mb-2">{chapterTitle}</h1>
          <p className="text-gray-500 mb-6">
            What's the action you're committing to?
          </p>

          <textarea
            className="w-full border rounded-lg p-3 h-32 mb-6"
            placeholder="e.g. I will lay out my gym clothes the night before, every night this week."
            value={selfCommitment}
            onChange={(e) => setSelfCommitment(e.target.value)}
          />

          <button
            onClick={saveSelfDeclared}
            disabled={selfSaving || !selfCommitment.trim()}
            className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-40"
          >
            {selfSaving ? "Saving..." : "Save My Commitment"}
          </button>
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
                  <div className="text-sm font-semibold text-gray-700 mb-1">CHAPTER TAKEAWAY</div>
                  <p className="text-gray-900">{summaryData.chapterTakeaway}</p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">PERSONAL INSIGHT</div>
                  <p className="text-gray-900">{summaryData.personalInsight}</p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">COMMITMENT</div>
                  <p className="text-gray-900">{summaryData.commitment}</p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">OBSTACLE</div>
                  <p className="text-gray-900">{summaryData.obstacle}</p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">STRATEGY</div>
                  <p className="text-gray-900">{summaryData.strategy}</p>
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
                setRememberInput("");
                setStoodOutInput("");
                setStopThinkInput("");
                setActionSuggestedInput("");
                setExtraInput("");
                setShowExtraBox(false);
                setJournal("");
                setMessages([]);
                setSummaryData(null);
                setLockInStatement("");
                setScreen("spiral");
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