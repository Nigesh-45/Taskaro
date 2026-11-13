"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, logOut } from "@/lib/firebase";
import { toast } from "sonner";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  CircleDot,
  LogOut,
  Trash2,
  Sun,
  Moon,
} from "lucide-react";
import SlingButton from "./SlingButton";

const STATUS_OPTIONS = ["Planned", "In Progress", "Complete"];
const MAX_TITLE_LENGTH = 100;

const STATUS_STYLES = {
  Planned: {
    lightBadge: "bg-neutral-100 text-neutral-700 border-neutral-300",
    darkBadge: "bg-neutral-900 text-neutral-300 border-neutral-700",
    lightActiveBtn: "bg-black text-white border-black shadow-sm",
    darkActiveBtn: "bg-white text-black border-white shadow-sm",
    dot: "bg-neutral-400",
    icon: CircleDot,
  },
  "In Progress": {
    lightBadge: "bg-amber-50 text-amber-800 border-amber-300",
    darkBadge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    lightActiveBtn: "bg-amber-500 text-white border-amber-500 shadow-sm",
    darkActiveBtn: "bg-amber-500 text-black border-amber-500 shadow-sm",
    dot: "bg-amber-500",
    icon: Clock,
  },
  Complete: {
    lightBadge: "bg-emerald-50 text-emerald-800 border-emerald-300",
    darkBadge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    lightActiveBtn: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
    darkActiveBtn: "bg-emerald-500 text-black border-emerald-500 shadow-sm",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
};

export default function Dashboard({ user, theme = "dark", onToggleTheme }) {
  const [tasks, setTasks] = useState([]);
  const [optimisticStatusMap, setOptimisticStatusMap] = useState({});
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [titleInput, setTitleInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  const isDark = theme === "dark";

  // Subscribe strictly to tasks belonging to the authenticated user's UID
  useEffect(() => {
    if (!user?.uid || !db) return;
    setLoadingTasks(true);

    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Client-side chronological sort avoids requiring composite index creation
        loaded.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() ?? a.clientCreatedAt ?? 0;
          const timeB = b.createdAt?.toMillis?.() ?? b.clientCreatedAt ?? 0;
          return timeB - timeA;
        });

        setTasks(loaded);
        setLoadingTasks(false);
      },
      (error) => {
        console.error("Failed to fetch tasks:", error);
        toast.error(
          "Could not load tasks. Please check your connection or Firestore rules."
        );
        setLoadingTasks(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Create Task with strict trimming & 100-char limit (invoked by SlingButton onSend or Enter key)
  const sendMessage = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (creating) return;

    const trimmed = titleInput.trim();

    if (!trimmed) {
      toast.warning("Task title cannot be empty or only whitespace.");
      return;
    }

    if (trimmed.length > MAX_TITLE_LENGTH) {
      toast.error(
        `Task title must be ${MAX_TITLE_LENGTH} characters or fewer.`
      );
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, "tasks"), {
        userId: user.uid,
        title: trimmed,
        status: "Planned",
        createdAt: serverTimestamp(),
        clientCreatedAt: Date.now(),
      });
      setTitleInput("");
      toast.success("Task launched!");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  // Optimistic UI Status Update
  const handleStatusChange = async (task, nextStatus) => {
    const currentStatus = optimisticStatusMap[task.id] ?? task.status;
    if (currentStatus === nextStatus) return;

    // 1. Apply status update immediately in UI
    setOptimisticStatusMap((prev) => ({ ...prev, [task.id]: nextStatus }));

    try {
      // 2. Persist status update to Firestore in background
      await updateDoc(doc(db, "tasks", task.id), {
        userId: user.uid,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      setOptimisticStatusMap((prev) => {
        const copy = { ...prev };
        delete copy[task.id];
        return copy;
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      // Roll back optimistic state on failure
      setOptimisticStatusMap((prev) => {
        const copy = { ...prev };
        delete copy[task.id];
        return copy;
      });
      toast.error("Failed to update status. Change was reverted.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task.");
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success("Signed out safely");
    } catch (error) {
      toast.error("Failed to sign out.");
    }
  };

  const resolvedTasks = useMemo(
    () =>
      tasks.map((t) => ({
        ...t,
        status: optimisticStatusMap[t.id] ?? t.status,
      })),
    [tasks, optimisticStatusMap]
  );

  const filteredTasks = useMemo(() => {
    if (filterStatus === "All") return resolvedTasks;
    return resolvedTasks.filter((t) => t.status === filterStatus);
  }, [resolvedTasks, filterStatus]);

  const counts = useMemo(() => {
    const tally = {
      All: resolvedTasks.length,
      Planned: 0,
      "In Progress": 0,
      Complete: 0,
    };
    for (const t of resolvedTasks) {
      if (tally[t.status] !== undefined) tally[t.status] += 1;
    }
    return tally;
  }, [resolvedTasks]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-black text-white" : "bg-neutral-50 text-black"
      }`}
    >
      {/* Top Header */}
      <header
        className={`sticky top-0 z-20 border-b backdrop-blur-md transition-colors duration-300 ${
          isDark
            ? "border-neutral-800 bg-black/85"
            : "border-neutral-200 bg-white/85"
        }`}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Taskaro</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle color theme"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                isDark
                  ? "border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800"
                  : "border-neutral-200 bg-white text-black hover:bg-neutral-100"
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* User Profile Pill */}
            <div
              className={`flex items-center gap-2.5 rounded-full border py-1 pl-1.5 pr-3 ${
                isDark
                  ? "border-neutral-800 bg-neutral-900"
                  : "border-neutral-200 bg-neutral-100"
              }`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User avatar"}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
              )}
              <span
                className={`hidden max-w-[160px] truncate text-xs font-medium sm:inline ${
                  isDark ? "text-neutral-200" : "text-neutral-800"
                }`}
              >
                {user.displayName || user.email}
              </span>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                isDark
                  ? "border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800"
                  : "border-neutral-200 bg-white text-black hover:bg-neutral-100"
              }`}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Task Creation Card with React Bits SlingButton */}
        <section
          className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${
            isDark
              ? "border-neutral-800 bg-neutral-950"
              : "border-neutral-200 bg-white"
          }`}
        >
          <form onSubmit={sendMessage} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="task-title"
                className={`block text-xs font-semibold uppercase tracking-wider ${
                  isDark ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                Create a New Task
              </label>
              <span
                className={`text-[11px] ${
                  isDark ? "text-neutral-500" : "text-neutral-400"
                }`}
              >
                Tap or pull &amp; release the slingshot button to launch
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="task-title"
                  type="text"
                  value={titleInput}
                  maxLength={MAX_TITLE_LENGTH}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="What needs to get done?"
                  className={`h-14 w-full rounded-xl border px-4 pr-16 text-sm focus:outline-none focus:ring-2 ${
                    isDark
                      ? "border-neutral-800 bg-black text-white placeholder:text-neutral-500 focus:border-white focus:ring-white/15"
                      : "border-neutral-300 bg-white text-black placeholder:text-neutral-400 focus:border-black focus:ring-black/10"
                  }`}
                />
                <span
                  className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium ${
                    titleInput.trim().length >= 90
                      ? "text-amber-500"
                      : "text-neutral-500"
                  }`}
                >
                  {titleInput.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>

              {/* React Bits SlingButton Integration */}
              <SlingButton
                onSend={() => sendMessage()}
                padColor={isDark ? "#f5f5f5" : "#18181b"}
                iconColor={isDark ? "#18181b" : "#f5f5f5"}
                accentColor={isDark ? "#f5f5f5" : "#18181b"}
                wellColor={isDark ? "#27272a" : "#e4e4e7"}
                bandColor="#52525b"
                size={56}
                strokeWidth={3}
                armAt={48}
                maxPull={160}
                launchSpeed={2600}
                recoil={0.2}
                flight={120}
                particles={14}
                spread={60}
                axis="any"
                tapSends
                disabled={creating}
              />
            </div>
          </form>
        </section>

        {/* Status Filter Tabs */}
        <section className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {["All", ...STATUS_OPTIONS].map((tab) => {
              const active = filterStatus === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterStatus(tab)}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? isDark
                        ? "bg-white text-black shadow-sm"
                        : "bg-black text-white shadow-sm"
                      : isDark
                        ? "border border-neutral-800 bg-neutral-950 text-neutral-400 hover:bg-neutral-900 hover:text-white"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black"
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                      active
                        ? isDark
                          ? "bg-black/15 text-black"
                          : "bg-white/20 text-white"
                        : isDark
                          ? "bg-neutral-900 text-neutral-400"
                          : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Task List / Skeletons / Empty State */}
        <section className="mt-4">
          {loadingTasks ? (
            <div
              className="space-y-3"
              aria-busy="true"
              aria-label="Loading tasks"
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`flex animate-pulse items-center justify-between rounded-2xl border p-4 ${
                    isDark
                      ? "border-neutral-800 bg-neutral-950"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="space-y-2">
                    <div
                      className={`h-4 w-56 rounded ${
                        isDark ? "bg-neutral-800" : "bg-neutral-200"
                      }`}
                    />
                    <div
                      className={`h-3 w-24 rounded ${
                        isDark ? "bg-neutral-900" : "bg-neutral-100"
                      }`}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <div
                      className={`h-7 w-20 rounded-lg ${
                        isDark ? "bg-neutral-800" : "bg-neutral-200"
                      }`}
                    />
                    <div
                      className={`h-7 w-24 rounded-lg ${
                        isDark ? "bg-neutral-900" : "bg-neutral-100"
                      }`}
                    />
                    <div
                      className={`h-7 w-20 rounded-lg ${
                        isDark ? "bg-neutral-900" : "bg-neutral-100"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : resolvedTasks.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center ${
                isDark
                  ? "border-neutral-800 bg-neutral-950"
                  : "border-neutral-300 bg-white"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isDark
                    ? "bg-neutral-900 text-neutral-300"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3
                className={`mt-4 text-base font-semibold ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                No tasks yet. Let&apos;s get started.
              </h3>
              <p
                className={`mt-1 max-w-sm text-xs ${
                  isDark ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                Add your first task above and track its progress from Planned to
                Complete with a single click.
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div
              className={`rounded-2xl border p-10 text-center text-sm ${
                isDark
                  ? "border-neutral-800 bg-neutral-950 text-neutral-400"
                  : "border-neutral-200 bg-white text-neutral-500"
              }`}
            >
              No tasks match the{" "}
              <span className="font-semibold">{filterStatus}</span> filter.
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredTasks.map((task) => {
                const style =
                  STATUS_STYLES[task.status] || STATUS_STYLES.Planned;
                return (
                  <li
                    key={task.id}
                    className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 shadow-sm transition sm:flex-row sm:items-center ${
                      isDark
                        ? "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`break-words text-sm font-medium ${
                            task.status === "Complete"
                              ? "text-neutral-500 line-through"
                              : isDark
                                ? "text-white"
                                : "text-black"
                          }`}
                        >
                          {task.title}
                        </p>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                            isDark ? style.darkBadge : style.lightBadge
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {/* One-Click Optimistic Status Switcher + Delete */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
                      <div
                        role="group"
                        aria-label={`Change status for ${task.title}`}
                        className={`inline-flex rounded-xl border p-1 ${
                          isDark
                            ? "border-neutral-800 bg-black"
                            : "border-neutral-200 bg-neutral-100"
                        }`}
                      >
                        {STATUS_OPTIONS.map((statusOption) => {
                          const isCurrent = task.status === statusOption;
                          const optionStyle = STATUS_STYLES[statusOption];
                          return (
                            <button
                              key={statusOption}
                              type="button"
                              onClick={() =>
                                handleStatusChange(task, statusOption)
                              }
                              className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                isCurrent
                                  ? isDark
                                    ? optionStyle.darkActiveBtn
                                    : optionStyle.lightActiveBtn
                                  : isDark
                                    ? "text-neutral-400 hover:text-white"
                                    : "text-neutral-600 hover:text-black"
                              }`}
                            >
                              {statusOption}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete task"
                        aria-label={`Delete ${task.title}`}
                        className={`cursor-pointer rounded-xl p-2 transition ${
                          isDark
                            ? "text-neutral-500 hover:bg-neutral-900 hover:text-white"
                            : "text-neutral-400 hover:bg-neutral-100 hover:text-black"
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
