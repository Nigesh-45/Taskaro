"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/firebase";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck, Sun, Moon } from "lucide-react";
import Antigravity from "./Antigravity";

export default function LoginView({ theme = "dark", onToggleTheme }) {
  const [signingIn, setSigningIn] = useState(false);
  const isDark = theme === "dark";

  const handleGoogleLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);

    try {
      const user = await signInWithGoogle();
      toast.success(`Welcome, ${user.displayName || "there"}!`);
    } catch (err) {
      if (err?.code === "auth/popup-closed-by-user") {
        toast.info("Sign-in window was closed before completing.");
      } else if (err?.code === "auth/popup-blocked") {
        toast.error(
          "Pop-up blocked by browser. Please enable pop-ups for this site."
        );
      } else if (
        err?.code === "auth/configuration-not-found" ||
        err?.code === "auth/operation-not-allowed"
      ) {
        toast.error(
          "Google Sign-In is not enabled in Firebase Console yet. Enable it under Authentication -> Sign-in method -> Google."
        );
      } else if (err?.code === "auth/unauthorized-domain") {
        toast.error(
          "This domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains."
        );
      } else {
        toast.error(
          err?.message || "Unable to sign in with Google. Please try again."
        );
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 transition-colors duration-300 ${
        isDark ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Exclusive React Bits Antigravity Interactive 3D Particle Field (Monochrome B&W) */}
      <Antigravity
        count={320}
        magnetRadius={11}
        ringRadius={7.5}
        color={isDark ? "#ffffff" : "#171717"}
      />

      {/* Subtle Monochrome Ambient Glow */}
      <div
        className={`pointer-events-none absolute h-[420px] w-[420px] rounded-full blur-[150px] ${
          isDark ? "bg-white/10" : "bg-black/5"
        }`}
      />

      {/* Sleek Monochrome Glassmorphic Login Card */}
      <section
        className={`relative z-10 w-full max-w-md rounded-3xl border p-8 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? "border-neutral-800 bg-neutral-950/80 text-white"
            : "border-neutral-200 bg-white/85 text-black"
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                isDark
                  ? "border-neutral-700 bg-white text-black"
                  : "border-neutral-900 bg-black text-white"
              }`}
            >
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1
                className={`text-xl font-bold tracking-tight ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                Taskaro
              </h1>
              <p
                className={`text-xs ${
                  isDark ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                Personal Task Workspace
              </p>
            </div>
          </div>

          {/* Dark / Light Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              isDark
                ? "border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800"
                : "border-neutral-300 bg-neutral-100 text-black hover:bg-neutral-200"
            }`}
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        <h2
          className={`text-2xl font-semibold tracking-tight ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Streamlined task tracking, built for focus.
        </h2>
        <p
          className={`mt-2 text-sm leading-relaxed ${
            isDark ? "text-neutral-400" : "text-neutral-600"
          }`}
        >
          Sign in to create and move your private tasks seamlessly across{" "}
          <span
            className={`font-semibold ${isDark ? "text-white" : "text-black"}`}
          >
            Planned
          </span>
          ,{" "}
          <span
            className={`font-semibold ${isDark ? "text-white" : "text-black"}`}
          >
            In Progress
          </span>
          , and{" "}
          <span
            className={`font-semibold ${isDark ? "text-white" : "text-black"}`}
          >
            Complete
          </span>{" "}
          states.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={signingIn}
          className={`mt-8 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
            isDark
              ? "bg-white text-black hover:bg-neutral-200"
              : "bg-black text-white hover:bg-neutral-800"
          }`}
        >
          {signingIn ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Signing in with Google...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        <div
          className={`mt-6 flex items-center justify-center gap-2 text-xs ${
            isDark ? "text-neutral-400" : "text-neutral-500"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Strict per-user Firebase UID isolation enforced</span>
        </div>
      </section>
    </main>
  );
}
