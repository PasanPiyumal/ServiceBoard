"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomeView from "../../components/HomeView";
import RequestBoard from "../../components/RequestBoard";
import { useDashboardTab } from "../../components/dashboard-tab-context";

export default function DashboardPage() {
  const router = useRouter();
  const { tab, setTab } = useDashboardTab();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null,
  );
  const [flashNotice, setFlashNotice] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);

  useEffect(() => {
    const token = localStorage.getItem("sr_token");
    const rawUser = localStorage.getItem("sr_user");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch {
        setUser(null);
      }
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.sessionStorage.getItem("sr_flash_notice");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.message && parsed?.type) {
        setFlashNotice({
          type: parsed.type,
          message: parsed.message,
        });
        window.sessionStorage.removeItem("sr_flash_notice");
        const timeout = window.setTimeout(() => setFlashNotice(null), 3500);
        return () => window.clearTimeout(timeout);
      }
    } catch {
      window.sessionStorage.removeItem("sr_flash_notice");
    }
  }, [tab]);

  function setTabAndPush(t: "home" | "details") {
    setTab(t);
    router.push(`/dashboard?tab=${t}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="sr-glass sr-fade-up rounded-3xl border border-border-soft/60 p-6 sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
            Customer Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Hello {user?.name || "Customer"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Use the tabs beside your profile icon to switch between your home
            overview and your job details.
          </p>
        </div>
      </section>

      {flashNotice ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-md">
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              flashNotice.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {flashNotice.message}
          </div>
        </div>
      ) : null}

      {tab === "home" ? (
        <HomeView
          mode="dashboard"
          onCreated={() => {
            setTabAndPush("details");
          }}
        />
      ) : (
        <section className="mt-6 sr-glass rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Job Details
              </h2>
              <p className="text-sm text-slate-500">
                Full request details, status dropdown, and delete action live
                here.
              </p>
            </div>
          </div>

          {/* Job records are loaded from MongoDB here so the customer can inspect details, status, and delete actions. */}
          <RequestBoard showForm={false} ownerOnly={true} showDetails />
        </section>
      )}
    </div>
  );
}
