import Link from "next/link";
import RequestBoard from "./RequestBoard";
import DashboardStats from "./DashboardStats";

type Props = {
  mode?: "public" | "dashboard";
  onCreated?: () => void;
};

export default function HomeView({ mode = "public", onCreated }: Props) {
  const isDashboard = mode === "dashboard";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {!isDashboard ? (
        <section className="sr-fade-up sr-delay-1 relative mb-8 overflow-hidden rounded-3xl bg-linear-to-r from-brand to-brand-strong p-7 text-white sm:p-10">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-12 left-20 h-32 w-32 rounded-full bg-brand-accent/35 blur-xl" />
          <p className="mb-3 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide uppercase">
            Customer Operations Portal
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Manage service requests with clarity, speed, and better customer
            response.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
            Track incoming requests, centralize updates, and keep your team
            focused. Built with Next.js, Node.js APIs, and MongoDB Atlas for
            cloud persistence.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:-translate-y-px hover:bg-slate-100"
            >
              Login to Continue
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Create Account
            </Link>
          </div>
        </section>
      ) : (
        <section className="sr-fade-up sr-delay-1 mb-8 rounded-3xl border border-border-soft bg-white/80 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
            Customer Home
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Overview and request creation
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Use this tab to see your own stats and add a new request.
          </p>
        </section>
      )}

      <DashboardStats mineOnly={isDashboard} />

      <RequestBoard
        showForm={isDashboard}
        ownerOnly={isDashboard}
        showDetails={false}
        onCreated={onCreated}
      />

      {!isDashboard ? (
        <footer className="sr-fade-up sr-delay-4 mt-10 rounded-3xl border border-border-soft/80 bg-white/80 px-5 py-6 text-sm text-slate-600 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">
                Service Request Board
              </p>
              <p className="mt-1 text-slate-600">
                Professional request management with secure authentication and
                cloud data.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Built with Next.js, Node.js API routes, and MongoDB Atlas.
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
