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
      .select("id, chapter_title, commitment, commitment_done, created_at, lock_in_statement, stars")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setChapters(data || []);
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

  async function addStar(id: number, currentStars: number) {
    if (currentStars >= 5) return;
    const newStars = currentStars + 1;
    const isNowDone = newStars >= 5;

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Your Commitments</h1>
          <div className="bg-white border rounded-full px-4 py-1.5 flex items-center gap-2">
            <span className="text-amber-400">⭐</span>
            <span className="text-sm font-medium">{totalStars} actualizations</span>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400 italic">Loading...</p>
        ) : chapters.length === 0 ? (
          <p className="text-gray-500">No chapters yet — go complete one!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {chapters.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow p-5">
                <div className="text-sm text-gray-400 mb-1">
                  {new Date(c.created_at).toLocaleDateString()}
                </div>
                <div className="font-semibold mb-2">{c.chapter_title || "Untitled Chapter"}</div>
                <div className="text-gray-700 mb-4">{c.commitment}</div>

                {c.lock_in_statement && (
                  <div className="bg-gray-900 text-white rounded-lg p-4 italic text-sm leading-relaxed mb-4">
                    {c.lock_in_statement}
                  </div>
                )}

                <div className="flex gap-2 mb-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button
                      key={i}
                      onClick={() => addStar(c.id, c.stars || 0)}
                      disabled={(c.stars || 0) >= 5}
                      className="text-3xl leading-none disabled:cursor-default"
                    >
                      {i < (c.stars || 0) ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>

                {c.commitment_done ? (
                  <p className="text-sm font-medium text-green-600">Complete! This one's done.</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {c.stars || 0} of 5 — tap a star each time you follow through
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <a href="/" className="block text-center mt-6 text-gray-500 underline">
          ← Back to start a new chapter
        </a>
      </div>
    </div>
  );
}