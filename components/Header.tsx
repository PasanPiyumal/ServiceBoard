// @ts-nocheck
"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAuthStorage,
  readStoredUser,
  syncAuthStorageWithRuntime,
} from "../lib/auth-storage";
import { useDashboardTab } from "./dashboard-tab-context";

export default function Header() {
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { tab: dashboardTab, setTab: setDashboardTab } = useDashboardTab();
  const brandHref = user ? "/dashboard" : "/";
  const isDashboard = pathname.startsWith("/dashboard");

  const initials = useMemo(() => {
    const name = user?.name?.trim() || "";
    if (!name) return "U";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user]);

  function syncUserFromStorage() {
    syncAuthStorageWithRuntime();
    setUser(readStoredUser());
  }

  useEffect(() => {
    syncUserFromStorage();
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("authchange", syncUserFromStorage);
    window.addEventListener("storage", syncUserFromStorage);
    window.addEventListener("focus", syncUserFromStorage);
    window.addEventListener("pageshow", syncUserFromStorage);
    return () => {
      window.removeEventListener("authchange", syncUserFromStorage);
      window.removeEventListener("storage", syncUserFromStorage);
      window.removeEventListener("focus", syncUserFromStorage);
      window.removeEventListener("pageshow", syncUserFromStorage);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function logout() {
    clearAuthStorage();
    window.dispatchEvent(new Event("authchange"));
    setUser(null);
    setMenuOpen(false);
    window.location.replace("/");
  }

  function openDashboardTab(tab: "home" | "details") {
    setDashboardTab(tab);
    router.push(`/dashboard?tab=${tab}`);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border-soft/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href={brandHref} className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
            SR
          </span>
          <span className="text-base font-semibold text-slate-900 sm:text-lg">
            Service Request Board
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          {user && isDashboard ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openDashboardTab("home")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  dashboardTab === "home"
                    ? "bg-brand text-white"
                    : "border border-border-soft bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => openDashboardTab("details")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  dashboardTab === "details"
                    ? "bg-brand text-white"
                    : "border border-border-soft bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                Job Details
              </button>
            </div>
          ) : null}

          {user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((value) => !value)}
                className="flex items-center gap-3 rounded-full border border-border-soft bg-white px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white shadow-sm">
                  {initials}
                </span>
                <span className="hidden sm:flex sm:flex-col sm:items-start">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Hello
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {user.name || "Customer"}
                  </span>
                </span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-4 w-4 text-slate-500 transition ${menuOpen ? "rotate-180" : ""}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] w-60 rounded-2xl border border-border-soft bg-white p-2 shadow-xl">
                  <div className="rounded-xl bg-surface-soft px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Signed in as
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {user.name || "Customer"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email || "Account"}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : pathname !== "/login" && pathname !== "/signup" ? (
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Login
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
