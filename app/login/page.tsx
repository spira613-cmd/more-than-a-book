"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const [mode, setMode] = useState<"link" | "code">("link");
  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [codeSending, setCodeSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState("");

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

  async function sendCode() {
    if (!email.trim()) return;
    setCodeSending(true);
    setCodeError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    setCodeSending(false);

    if (error) {
      setCodeError(error.message);
    } else {
      setCode("");
      setCodeSent(true);
    }
  }

  async function verifyCode() {
    if (code.trim().length !== 6) return;
    setVerifying(true);
    setCodeError("");

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    setVerifying(false);

    if (error) {
      setCodeError(
        error.message || "That code didn't work — check it and try again, or request a new one."
      );
    } else {
      window.location.href = "/";
    }
  }

  function requestNewCode() {
    setCodeSent(false);
    setCode("");
    setCodeError("");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-teal-100 p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 text-center">
        <h1 className="text-2xl font-semibold mb-2">More Than A Book</h1>

        {sent ? (
          <>
            <p className="text-green-500 mb-6">
              Enter your email and we'll send you a link to sign in.
            </p>
            <p className="text-green-600 font-medium">
              Check your email for a sign-in link.
            </p>
          </>
        ) : codeSent ? (
          <>
            <p className="text-green-500 mb-6">
              Enter the 6-digit code we sent to {email.trim()}.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              className="w-full border rounded-lg p-3 mb-4 text-center text-2xl tracking-[0.5em]"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            />
            {codeError && <p className="text-red-500 text-sm mb-3">{codeError}</p>}
            <button
              onClick={verifyCode}
              disabled={verifying || code.trim().length !== 6}
              className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-40 mb-3"
            >
              {verifying ? "Verifying..." : "Verify Code"}
            </button>
            <button onClick={requestNewCode} className="text-sm text-gray-500 underline">
              Request a new code
            </button>
          </>
        ) : (
          <>
            <p className="text-green-500 mb-6">
              {mode === "link"
                ? "Enter your email and we'll send you a link to sign in."
                : "Enter your email and we'll send you a 6-digit code."}
            </p>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setMode("link");
                  setError("");
                  setCodeError("");
                }}
                className={
                  "flex-1 rounded-lg py-2 text-sm font-medium " +
                  (mode === "link" ? "bg-black text-white" : "border text-gray-600")
                }
              >
                Email me a link
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("code");
                  setError("");
                  setCodeError("");
                }}
                className={
                  "flex-1 rounded-lg py-2 text-sm font-medium " +
                  (mode === "code" ? "bg-black text-white" : "border text-gray-600")
                }
              >
                Email me a code
              </button>
            </div>

            <input
              type="email"
              className="w-full border rounded-lg p-3 mb-4"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {mode === "link" ? (
              <>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <button
                  onClick={sendMagicLink}
                  disabled={sending || !email.trim()}
                  className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-40"
                >
                  {sending ? "Sending..." : "Send Sign-In Link"}
                </button>
              </>
            ) : (
              <>
                {codeError && <p className="text-red-500 text-sm mb-3">{codeError}</p>}
                <button
                  onClick={sendCode}
                  disabled={codeSending || !email.trim()}
                  className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-40"
                >
                  {codeSending ? "Sending..." : "Send Code"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
