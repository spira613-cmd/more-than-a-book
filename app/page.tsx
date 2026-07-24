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

type Screen =
  | "welcome"
  | "spiral"
  | "form"
  | "journalChoice"
  | "journalDisplay"
  | "coaching"
  | "summary"
  | "selfDeclared";

function LineChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path
        d="M4 16l4.5-5 3.5 3 5-6.5 3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="10.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FeatherBookIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <path
        d="M6 28V13c4-2 10-2 14 1M34 28V13c-4-2-10-2-14 1M20 14v16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27 6c-3 1-5 4-5 8 4-1 6-4 5-8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M23.5 13.5L27 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function BookOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path
        d="M12 6.5c-2-1.3-5-1.5-8-.7v12c3-.8 6-.6 8 .7 2-1.3 5-1.5 8-.7v-12c-3-.8-6-.6-8 .7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 6.5v12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function HeartOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path
        d="M12 20s-7-4.3-9.5-8.8C.8 7.8 2.6 4.5 6 4.2c2-.2 3.7.9 6 3 2.3-2.1 4-3.2 6-3 3.4.3 5.2 3.6 3.5 7-2.5 4.5-9.5 8.8-9.5 8.8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SproutOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M12 21V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 15c0-3.5-2.5-5-6-5 0 3.5 2.5 5 6 5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M6 21h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MountainFlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path
        d="M3 19l6.5-10L13 14l2-3 6 8H3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M15 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 4l4 2-4 2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function HillsScene() {
  return (
    <svg viewBox="0 0 400 160" className="w-full h-auto">
      <circle cx="330" cy="58" r="26" fill="#f6c893" opacity="0.9" />
      <path d="M0 108c50-30 100-30 150 0s100 30 150 0 80-25 100 0v52H0z" fill="#cfe0ca" />
      <path d="M0 128c60-25 110-20 160 5s100 25 150 0 60-15 90 5v32H0z" fill="#a9c69f" />
      <path
        d="M40 160c40-42 90-56 140-40"
        stroke="#faf6ef"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <g stroke="#7b9b74" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M10 155c0-10 4-16 10-18M10 155c0-8-4-13-9-15" />
        <path d="M390 150c0-9-4-15-9-17M390 150c0-7 3-12 8-14" />
      </g>
    </svg>
  );
}

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

        if (!data.session.user.user_metadata?.has_seen_onboarding) {
          setScreen("welcome");
        } else if (typeof window !== "undefined") {
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

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function completeOnboarding() {
    await supabase.auth.updateUser({ data: { has_seen_onboarding: true } });
    setScreen("spiral");
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
  const [commitmentDuration, setCommitmentDuration] = useState(5);
  const [customDuration, setCustomDuration] = useState(false);
  const [selfSaving, setSelfSaving] = useState(false);
  const [doneSaving, setDoneSaving] = useState(false);

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
  const [wrapUpChapterId, setWrapUpChapterId] = useState<number | null>(null);
  const [wrapUpDuration, setWrapUpDuration] = useState(5);
  const [wrapUpCustomDuration, setWrapUpCustomDuration] = useState(false);

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

  function noteManualEdit(field: ReflectionField, value: string) {
    // Keep the in-progress recognition session's base in sync with manual
    // edits (e.g. backspacing a bit someone doesn't like) so the next
    // recognized phrase builds on the edited text instead of overwriting it.
    if (isListening && activeFieldRef.current === field) {
      sessionBaseRef.current = value;
    }
  }

  function startListeningFor(field: ReflectionField) {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      return;
    }

    setActiveField(field);
    activeFieldRef.current = field;
    if (field === "extra") setShowExtraBox(true);
    sessionBaseRef.current = getFieldValue(field).trim();

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const finalChunk = result[0].transcript.trim();
          if (finalChunk) {
            sessionBaseRef.current = sessionBaseRef.current
              ? `${sessionBaseRef.current} ${finalChunk}`
              : finalChunk;
          }
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      interimTranscript = interimTranscript.replace(/\s+/g, " ").trim();
      const base = sessionBaseRef.current;
      const combined = interimTranscript
        ? base
          ? `${base} ${interimTranscript}`
          : interimTranscript
        : base;
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

  function toggleListeningForField(field: ReflectionField) {
    if (isListening && activeFieldRef.current === field) {
      recognitionRef.current?.abort();
      return;
    }

    if (isListening) {
      // Switching mid-recording to a different box: fully stop the old
      // recognition session before starting a fresh one for the new box,
      // rather than letting the old session keep targeting the wrong field.
      // Chrome can fire both onerror and onend after abort(), so guard
      // against starting the new session twice.
      const old = recognitionRef.current;
      if (old) {
        let restarted = false;
        const restart = () => {
          if (restarted) return;
          restarted = true;
          startListeningFor(field);
        };
        old.onresult = null;
        old.onend = restart;
        old.onerror = restart;
        old.abort();
        return;
      }
    }

    startListeningFor(field);
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
      const { data: inserted } = await supabase
        .from("chapters")
        .insert({
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
        })
        .select("id")
        .single();

      setWrapUpChapterId(inserted?.id ?? null);
      checkAndSendDigest();
    }
  }

  async function saveWrapUpDuration(days: number) {
    setWrapUpDuration(days);
    if (!wrapUpChapterId) return;
    await supabase.from("chapters").update({ duration_days: days }).eq("id", wrapUpChapterId);
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
      duration_days: commitmentDuration,
    });
checkAndSendDigest();
    setSelfSaving(false);
    window.location.href = "/checkin";
  }

  async function saveJournalOnly() {
    setDoneSaving(true);

    await supabase.from("chapters").insert({
      user_id: userId,
      chapter_title: chapterTitle,
      chapter_summary: buildChapterSummary(),
      journal: journal,
      conversation: [],
      chapter_takeaway: "",
      personal_insight: "",
      commitment: "",
      obstacle: "",
      strategy: "",
      lock_in_statement: "",
    });
    checkAndSendDigest();
    setDoneSaving(false);
    window.location.href = "/journal";
  }

  if (!authChecked || entriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 italic">Loading...</p>
      </div>
    );
  }

  if (screen === "welcome") {
    const milestones = [
      {
        day: 1,
        desc: "You started!",
        accent: "#3b5a48",
        bg: "#e4ede7",
        icon: <BookOutlineIcon />,
      },
      {
        day: 5,
        desc: "Your 5-day email",
        accent: "#d9704f",
        bg: "#fbe9e2",
        icon: <HeartOutlineIcon />,
      },
      {
        day: 10,
        desc: "Your 10-day assessment",
        accent: "#9b8bc4",
        bg: "#ece7f5",
        icon: <SproutOutlineIcon />,
      },
      {
        day: 15,
        desc: "Share with a friend",
        accent: "#d98fa0",
        bg: "#f7e6ea",
        icon: <MountainFlagIcon />,
      },
    ];

    return (
      <div className="min-h-screen flex flex-col items-center bg-[#faf6ef] px-6 py-10">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="w-full flex items-center gap-3 bg-white border border-[#eee3d3] rounded-2xl px-4 py-3 mb-8 shadow-sm">
            <span className="flex-none w-9 h-9 rounded-full bg-[#fbe9e2] text-[#d9704f] flex items-center justify-center">
              <LineChartIcon />
            </span>
            <p className="text-sm text-[#4b5347] leading-snug">
              Studies show that you forget up to{" "}
              <span className="font-bold text-[#d9704f]">70%</span> of what you read within the
              first day.
            </p>
          </div>

          <div className="flex flex-col items-center mb-6 text-[#3b5a48]">
            <FeatherBookIcon />
            <p
              className="text-[11px] font-semibold tracking-[0.25em] mt-2"
              style={{ fontVariant: "small-caps" }}
            >
              MORE THAN A BOOK
            </p>
          </div>

          <h1
            className="text-center text-[28px] leading-tight text-[#28331f] mb-2"
            style={{ fontFamily: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif' }}
          >
            What you reflect on,
            <br />
            you remember.
          </h1>
          <div className="w-16 h-[3px] bg-[#d9704f] rounded-full mb-4" />

          <p className="text-center text-sm text-[#6b7266] leading-relaxed mb-8 px-2">
            More Than A Book helps you capture what you're learning and turn it into small daily
            actions that create real change.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-8">
            {milestones.map((m) => (
              <div
                key={m.day}
                className="flex flex-col items-center text-center bg-white border border-[#eee3d3] rounded-xl p-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-1.5"
                  style={{ backgroundColor: m.bg, color: m.accent }}
                >
                  {m.day}
                </div>
                <div style={{ color: m.accent }}>{m.icon}</div>
                <p className="text-[10px] font-bold tracking-wide text-[#4b5347] mt-1.5">
                  DAY {m.day}
                </p>
                <div
                  className="w-6 h-[2px] rounded-full my-1.5"
                  style={{ backgroundColor: m.accent }}
                />
                <p className="text-[10.5px] text-[#8a8f83] leading-snug">{m.desc}</p>
              </div>
            ))}
          </div>

          <div className="w-full mb-8 rounded-2xl overflow-hidden">
            <HillsScene />
          </div>

          <button
            onClick={completeOnboarding}
            className="w-full bg-[#2f4a3c] text-white rounded-full py-3.5 font-medium flex items-center justify-center gap-2 mb-3"
          >
            Start day 1 <span aria-hidden="true">→</span>
          </button>

          <p className="text-xs text-[#8a8f83] flex items-center gap-1.5">
            🔒 Private. Personal. Just for you.
          </p>
        </div>
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
            <button onClick={signOut} className="text-sm text-gray-500 underline">
              Sign Out
            </button>
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
    const entryNumber = entries.length + 1;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#14181a] p-6">
        <div className="w-full max-w-xl bg-[#f6f1e8] text-[#211d15] rounded-xl shadow-[0_20px_44px_-18px_rgba(0,0,0,0.6)] p-8">
          <div className="flex justify-end gap-4 mb-2">
            <a href="/journal" className="text-sm text-[#8f8873] underline">
              View My Journal →
            </a>
            <a href="/checkin" className="text-sm text-[#8f8873] underline">
              View My Commitments →
            </a>
            <button onClick={signOut} className="text-sm text-[#8f8873] underline">
              Sign Out
            </button>
          </div>

          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#a6824a] mb-1.5">
            Entry {String(entryNumber).padStart(2, "0")} · Reflection
          </p>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Start a New Chapter</h1>
          <p className="text-[#8f8873] mb-6">
            Enter the book/chapter you just read and a short summary of what stood out to you.
          </p>

          <label className="block text-sm font-medium mb-1 text-[#5b5541]">Chapter Title</label>
          <input
            className="w-full border border-[#d9d0b8] bg-[#fffdf8] rounded-md p-3 mb-4 text-[#211d15] placeholder-[#a89f88]"
            placeholder="Name the chapter you read today"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
          />

          <div className="mb-1">
            <p className="text-base font-bold tracking-tight mb-0.5">
              Before the chapter fades, capture what you remember.
            </p>
            <p className="text-xs text-[#8f8873] mb-3">
              Answer whatever comes to mind. A sentence is enough.
              {!speechSupported && " Voice input isn't available in this browser — no problem, just type."}
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-2">
            {(
              [
                { field: "remember" as const, label: "What do you remember?", placeholder: "Sum up today's message in your own words.", value: rememberInput, setValue: setRememberInput },
                { field: "stoodOut" as const, label: "What stood out?", placeholder: "An idea, story, example, quote...", value: stoodOutInput, setValue: setStoodOutInput },
                { field: "stopThink" as const, label: "Made you stop and think?", placeholder: "Something surprising, challenging...", value: stopThinkInput, setValue: setStopThinkInput },
                { field: "actionSuggested" as const, label: "Did the author suggest trying anything?", placeholder: "Something specific they said to do or try...", value: actionSuggestedInput, setValue: setActionSuggestedInput },
              ]
            ).map(({ field, label, placeholder, value, setValue }) => (
              <div
                key={field}
                className={
                  "border rounded-md p-3 bg-[#fffdf8] " +
                  (activeField === field ? "border-[#a6824a]" : "border-[#e3dac0]")
                }
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-[10px] font-bold tracking-wide uppercase text-[#8a6a30]">{label}</label>
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={() => toggleListeningForField(field)}
                      aria-label={isListening && activeField === field ? "Stop voice input" : "Speak into this box"}
                      className={
                        "relative flex-none w-6 h-6 rounded-full flex items-center justify-center text-[11px] border " +
                        (isListening && activeField === field
                          ? "bg-[#7a3b2e] text-[#f6f1e8] border-[#7a3b2e]"
                          : "bg-[#211d15] text-[#e9d9ae] border-[#3a3324]")
                      }
                    >
                      {isListening && activeField === field && (
                        <span className="absolute inset-0 rounded-full border border-[#7a3b2e] animate-ping" />
                      )}
                      {isListening && activeField === field ? "●" : "🎙️"}
                    </button>
                  )}
                </div>
                <textarea
                  className="w-full resize-none text-sm outline-none overflow-hidden min-h-28 text-[#211d15] placeholder-[#a89f88]"
                  rows={4}
                  placeholder={placeholder}
                  value={value}
                  onFocus={() => setActiveField(field)}
                  onChange={(e) => {
                    setValue(e.target.value);
                    noteManualEdit(field, e.target.value);
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
              className="text-xs text-[#8f8873] underline mb-3"
            >
              + Anything else?
            </button>
          ) : (
            <div
              className={
                "border rounded-md p-3 mb-3 bg-[#fffdf8] " +
                (activeField === "extra" ? "border-[#a6824a]" : "border-[#e3dac0]")
              }
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[10px] font-bold tracking-wide uppercase text-[#8a6a30]">Anything else</label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => toggleListeningForField("extra")}
                    aria-label={isListening && activeField === "extra" ? "Stop voice input" : "Speak into this box"}
                    className={
                      "relative flex-none w-6 h-6 rounded-full flex items-center justify-center text-[11px] border " +
                      (isListening && activeField === "extra"
                        ? "bg-[#7a3b2e] text-[#f6f1e8] border-[#7a3b2e]"
                        : "bg-[#211d15] text-[#e9d9ae] border-[#3a3324]")
                    }
                  >
                    {isListening && activeField === "extra" && (
                      <span className="absolute inset-0 rounded-full border border-[#7a3b2e] animate-ping" />
                    )}
                    {isListening && activeField === "extra" ? "●" : "🎙️"}
                  </button>
                )}
              </div>
              <textarea
                className="w-full resize-none text-sm outline-none overflow-hidden text-[#211d15] placeholder-[#a89f88]"
                rows={2}
                placeholder="Anything else you don't want to forget..."
                value={extraInput}
                onFocus={() => setActiveField("extra")}
                onChange={(e) => {
                  setExtraInput(e.target.value);
                  noteManualEdit("extra", e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                spellCheck={true}
              />
            </div>
          )}

          <p className="font-bold mb-3">How would you like me to polish your journal?</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => generateJournal("keep")}
              className="w-full border border-[#e3dac0] bg-[#fffdf8] rounded-md py-3 font-medium text-left px-4"
            >
              <div className="font-semibold">Keep It Yours</div>
              <div className="text-sm text-[#8f8873]">Just proofread grammar and formatting.</div>
            </button>
            <button
              onClick={() => generateJournal("flow")}
              className="w-full border border-[#e3dac0] bg-[#fffdf8] rounded-md py-3 font-medium text-left px-4"
            >
              <div className="font-semibold">Make It Flow</div>
              <div className="text-sm text-[#8f8873]">Rewrite for smoother readability.</div>
            </button>
            <button
              onClick={() => generateJournal("expand")}
              className="w-full bg-[#211d15] text-[#e9d9ae] border border-[#211d15] rounded-md py-3 font-medium text-left px-4"
            >
              <div className="font-semibold">Add Context</div>
              <div className="text-sm text-[#b9ab84]">Includes related ideas from this book or author.</div>
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
                <button
                  onClick={saveJournalOnly}
                  disabled={doneSaving}
                  className="w-full text-center border rounded-lg py-3 font-medium text-gray-600 disabled:opacity-40"
                >
                  {doneSaving ? "Saving..." : "✔️ Done for today"}
                </button>
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

          <p className="text-sm font-medium text-gray-700 mb-2">
            How many days do you want to commit to this?
          </p>
          <div className="flex flex-wrap gap-2 mb-1">
            {[3, 7, 14, 21].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  setCommitmentDuration(days);
                  setCustomDuration(false);
                }}
                className={
                  "rounded-full px-4 py-1.5 text-sm font-medium border " +
                  (!customDuration && commitmentDuration === days
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-300")
                }
              >
                {days} days
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomDuration(true)}
              className={
                "flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium border " +
                (customDuration
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-300")
              }
            >
              Custom:
              <input
                type="number"
                min={1}
                max={365}
                value={commitmentDuration}
                onFocus={() => setCustomDuration(true)}
                onChange={(e) => {
                  setCustomDuration(true);
                  const parsed = parseInt(e.target.value, 10);
                  setCommitmentDuration(Number.isNaN(parsed) ? 1 : Math.min(365, Math.max(1, parsed)));
                }}
                className={
                  "w-10 rounded bg-transparent text-center outline-none " +
                  (customDuration ? "text-white" : "text-gray-900")
                }
              />
              days
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-6">
            You'll check in and mark it done once a day, up to this many days.
          </p>

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

            {summaryData?.commitment && (
              <div className="mb-8">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  How many days do you want to commit to this?
                </p>
                <div className="flex flex-wrap gap-2 mb-1">
                  {[3, 7, 14, 21].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setWrapUpCustomDuration(false);
                        saveWrapUpDuration(days);
                      }}
                      className={
                        "rounded-full px-4 py-1.5 text-sm font-medium border " +
                        (!wrapUpCustomDuration && wrapUpDuration === days
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-600 border-gray-300")
                      }
                    >
                      {days} days
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWrapUpCustomDuration(true)}
                    className={
                      "flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium border " +
                      (wrapUpCustomDuration
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-300")
                    }
                  >
                    Custom:
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={wrapUpDuration}
                      onFocus={() => setWrapUpCustomDuration(true)}
                      onChange={(e) => {
                        setWrapUpCustomDuration(true);
                        const parsed = parseInt(e.target.value, 10);
                        saveWrapUpDuration(Number.isNaN(parsed) ? 1 : Math.min(365, Math.max(1, parsed)));
                      }}
                      className={
                        "w-10 rounded bg-transparent text-center outline-none " +
                        (wrapUpCustomDuration ? "text-white" : "text-gray-900")
                      }
                    />
                    days
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  You'll check in and mark it done once a day, up to this many days.
                </p>
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
                setWrapUpChapterId(null);
                setWrapUpDuration(5);
                setWrapUpCustomDuration(false);
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