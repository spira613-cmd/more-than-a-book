"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Chapter = {
  id: number;
  chapter_title: string;
  commitment: string;
  commitment_done: boolean;
  created_at: string;
};

export default function CheckIn() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    setLoading(true);
    const { data } = await supabase
      .from("chapters")
      .select("id, chapter_title, commitment, commitment_done, created_at")
      .order("created_at", { ascending: false });

    setChapters(data || []);
    setLoading(false);
  }

  async function toggleDone(id: number, current: boolean) {
    await supabase
      .from("chapters")
      .update({ commitment_done: !current })
      .eq("id", id);

    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, commitment_done: !current } : c))
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-6">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold mb-6">Your Commitments</h1>

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

                <button
                  onClick={() => toggleDone(c.id, c.commitment_done)}
                  className={
                    c.commitment_done
                      ? "w-full bg-amber-400 text-white rounded-lg py-2 font-medium flex items-center justify-center gap-2"
                      : "w-full border rounded-lg py-2 font-medium"
                  }
                >
                  {c.commitment_done ? (
                    <>
                      <span className="text-xl">⭐</span> Done!
                    </>
                  ) : (
                    "Mark as Done"
                  )}
                </button>
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