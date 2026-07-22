"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Chapter = {
  id: number;
  chapter_title: string;
  commitment: string;
  commitment_done: boolean;
  created_at: string;
  lock_in_statement: string;
  stars: number;
  duration_days: number;
};

export default function CheckIn() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      } else {
        setAuthChecked(true);
        loadChapters(data.session.user.id);
      }
    });
  }, [router]);

  async function loadChapters(userId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("chapters")
      .select("id, chapter_title, commitment, commitment_done, created_at, lock_in_statement, stars, duration_days")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setChapters((data || []).filter((c) => c.commitment));
    setLoading(false);
  }

  function playStarChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [880, 1318.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const startTime = ctx.currentTime + i * 0.06;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
        osc.start(startTime);
        osc.stop(startTime + 0.18);
      });
    } catch (e) {
      // audio not supported, fail silently
    }
  }

  function playCompleteFanfare() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const startTime = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);
        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } catch (e) {
      // audio not supported, fail silently
    }
  }

  async function addStar(id: number, currentStars: number, durationDays: number) {
    if (currentStars >= durationDays) return;
    const newStars = currentStars + 1;
    const isNowDone = newStars >= durationDays;

    await supabase
      .from("chapters")
      .update({ stars: newStars, commitment_done: isNowDone })
      .eq("id", id);

    setChapters((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, stars: newStars, commitment_done: isNowDone } : c
      )
    );

    if (isNowDone) {
      playCompleteFanfare();
    } else {
      playStarChime();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function deleteChapter(id: number) {
    if (!window.confirm("Delete this entry? This can't be undone.")) return;

    const { error } = await supabase.from("chapters").delete().eq("id", id);

    if (error) {
      alert("Couldn't delete this entry: " + error.message);
      return;
    }

    setChapters((prev) => prev.filter((c) => c.id !== id));
  }

  const totalStars = chapters.reduce((sum, c) => sum + (c.stars || 0), 0);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 italic">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-6">
      <div className="w-full max-w-xl">
        <div className="flex justify-between items-center mb-4">
          <a href="/" className="text-sm text-gray-500 underline">
            ← Your journey
          </a>
          <div className="flex items-center gap-4">
            <div className="bg-white border rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="text-amber-400">⭐</span>
              <span className="text-sm font-medium">{totalStars} actualizations</span>
            </div>
            <button onClick={signOut} className="text-sm text-gray-500 underline">
              Sign Out
            </button>
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold mb-2">
          You're transforming — pick one today
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Check in on your commitments, then continue to today's chapter.
        </p>

        <a
          href="/?screen=form"
          className="block w-full bg-black text-white text-center rounded-lg py-3 font-medium mb-8"
        >
          Continue to Today's Chapter →
        </a>

        {loading ? (
          <p className="text-gray-400 italic">Loading...</p>
        ) : chapters.length === 0 ? (
          <p className="text-gray-500">No chapters yet — go complete one!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {chapters.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-gray-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => deleteChapter(c.id)}
                    className="text-xs text-gray-400 hover:text-red-500 underline"
                  >
                    Delete
                  </button>
                </div>
                <div className="font-semibold mb-2">{c.chapter_title || "Untitled Chapter"}</div>
                <div className="text-gray-700 mb-4">{c.commitment}</div>

                {c.lock_in_statement && (
                  <div className="bg-gray-900 text-white rounded-lg p-4 italic text-sm leading-relaxed mb-4">
                    {c.lock_in_statement}
                  </div>
                )}

                {(() => {
                  const duration = c.duration_days || 5;
                  const stars = c.stars || 0;

                  return duration <= 7 ? (
                    <div className="flex gap-2 mb-2">
                      {Array.from({ length: duration }, (_, i) => i).map((i) => (
                        <button
                          key={i}
                          onClick={() => addStar(c.id, stars, duration)}
                          disabled={stars >= duration}
                          className="text-3xl leading-none disabled:cursor-default"
                        >
                          {i < stars ? "⭐" : "☆"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => addStar(c.id, stars, duration)}
                      disabled={stars >= duration}
                      className="w-full mb-2 disabled:cursor-default"
                    >
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full"
                          style={{ width: `${Math.min(100, (stars / duration) * 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })()}

                {c.commitment_done ? (
                  <p className="text-sm font-medium text-green-600">Complete! This one's done.</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {c.stars || 0} of {c.duration_days || 5} — tap {(c.duration_days || 5) <= 7 ? "a star" : "to check in"} each time you follow through
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <a
          href="/?screen=form"
          className="block w-full border text-center rounded-lg py-3 font-medium mt-6"
        >
          Continue to Today's Chapter →
        </a>
      </div>
    </div>
  );
}