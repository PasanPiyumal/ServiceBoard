// @ts-nocheck
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { persistAuth, readStoredToken } from "../../lib/auth-storage";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = readStoredToken();
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function submit(e: any) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.ok) {
      persistAuth(json.token, json.user);
      window.dispatchEvent(new Event("authchange"));
      router.replace("/dashboard");
    } else {
      setError(json.error || "Login failed");
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-120px)] max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:items-center">
      <section className="sr-fade-up sr-delay-1 rounded-3xl bg-linear-to-br from-brand to-brand-strong p-7 text-white sm:p-10">
        <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-white/80">
          Welcome Back
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Sign in to manage and track customer requests.
        </h1>
        <p className="mt-4 text-sm leading-7 text-white/90">
          Access your dashboard, submit new tickets, and keep updates
          centralized for your support workflow.
        </p>
      </section>

      <section className="sr-glass sr-fade-up sr-delay-2 rounded-3xl p-6 sm:p-8">
        <h2 className="mb-2 text-2xl font-semibold text-slate-900">Login</h2>
        <p className="mb-5 text-sm text-slate-600">
          Use your account credentials to continue.
        </p>
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            className="rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
          />
          <input
            className="rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
          />
          <button className="mt-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-strong">
            Login
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          don&apos;t you have an account.{" "}
          <Link
            href="/signup"
            className="font-semibold text-brand-strong underline"
          >
            Sign Up
          </Link>
        </p>
        <div className="mt-3 text-xs text-slate-500">
          Secure session is stored after successful login.
        </div>
      </section>
    </div>
  );
}
