"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import LoginView from "@/components/LoginView";
import Dashboard from "@/components/Dashboard";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [theme, setTheme] = useState("dark"); // "dark" | "light"

  useEffect(() => {
    const savedTheme =
      typeof window !== "undefined"
        ? window.localStorage.getItem("taskaro-theme")
        : null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("taskaro-theme", next);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setInitializing(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  if (initializing) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          theme === "dark" ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <div className="flex items-center gap-3 text-sm font-medium">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Initializing workspace...</span>
        </div>
      </div>
    );
  }

  return user ? (
    <Dashboard user={user} theme={theme} onToggleTheme={toggleTheme} />
  ) : (
    <LoginView theme={theme} onToggleTheme={toggleTheme} />
  );
}
