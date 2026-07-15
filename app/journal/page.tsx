"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Chapter = {
  id: number;
  chapter_title: string;
  journal: string;
  created_at: string;
};

export default function JournalArchive() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    setLoading(true);
    const { data } = await supabase
      .from("chapters")
      .select("id, chapter_title, journal, created_at")
      .order("created_at", { ascending: false });

    setChapters(data || []);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-stone-100 p-6">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap");
        .journal-font {
          font-family: "Caveat", cursive;
        }
      `}</style>

      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold mb-6 text-stone-800">Your Journal</h1>

        {loading ? (
          <p className="text-gray-400 italic">Loading...</p>
        ) : chapters.length === 0 ? (
          <p className="text-gray-500">No journal entries yet — go complete a chapter!</p>
        ) : (
          <div className="flex flex-col gap-6">
            {chapters.map((c) => (
              <div
                key={c.id}
                className="rounded-lg shadow-lg p-8 relative"
                style={{
                  backgroundColor: "#fffdf7",
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent, transparent 34px, #d8dce8 35px)",
                  backgroundSize: "100% 35px",
                }}
              >
                <div className="text-sm text-stone-400 mb-1 font-sans">
                  {new Date(c.created_at).toLocaleDateString()}
                </div>
                <div className="journal-font text-2xl text-stone-800 mb-3">
                  {c.chapter_title || "Untitled Chapter"}
                </div>
                <p className="journal-font text-2xl leading-[35px] text-stone-800 whitespace-pre-wrap">
                  {c.journal || "No journal entry recorded for this chapter."}
                </p>
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