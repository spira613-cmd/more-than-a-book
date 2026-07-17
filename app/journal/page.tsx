"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Chapter = {
  id: number;
  chapter_title: string;
  journal: string;
  created_at: string;
  commitment: string;
  lock_in_statement: string;
};

export default function JournalArchive() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
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
      .select("id, chapter_title, journal, created_at, commitment, lock_in_statement")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setChapters(data || []);
    setLoading(false);
  }

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400 italic">Loading...</p>
      </div>
    );
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

                {c.commitment && (
                  <div className="mt-4 font-sans">
                    <button
                      onClick={() => toggleExpand(c.id)}
                      className="text-sm text-stone-500 underline"
                    >
                      {expandedId === c.id ? "Hide my actionable ▲" : "Show my actionable ▼"}
                    </button>

                    {expandedId === c.id && (
                      <div className="mt-3 bg-stone-50 border border-stone-200 rounded-lg p-4">
                        <div className="text-xs font-semibold text-stone-500 mb-1">
                          COMMITMENT
                        </div>
                        <p className="text-stone-700 mb-3">{c.commitment}</p>

                        {c.lock_in_statement && (
                          <div className="bg-gray-900 text-white rounded-lg p-3 italic text-sm leading-relaxed">
                            {c.lock_in_statement}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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