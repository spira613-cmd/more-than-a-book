"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendMagicLink() {
    if (!email.trim()) return;
    setSending(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });

    setSending(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-teal-100 p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 text-center">
        <h1 className="text-2xl font-semibold mb-2">More Than A Book</h1>
        <p className="text-green-500 mb-6">
          Enter your email and we'll send you a link to sign in.
        </p>

        {sent ? (
          <p className="text-green-600 font-medium">
            Check your email for a sign-in link.
          </p>
        ) : (
          <>
            <input
              type="email"
              className="w-full border rounded-lg p-3 mb-4"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              onClick={sendMagicLink}
              disabled={sending || !email.trim()}
              className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-40"
            >
              {sending ? "Sending..." : "Send Sign-In Link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}