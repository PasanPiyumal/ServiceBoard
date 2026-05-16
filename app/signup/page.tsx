// @ts-nocheck
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { persistAuth, readStoredToken } from "../../lib/auth-storage";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();
    if (json.ok) {
      persistAuth(json.token, json.user);
      window.dispatchEvent(new Event("authchange"));
      router.replace("/dashboard");
    } else {
      setError(json.error || "Signup failed");
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-120px)] max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:items-center">
      <section className="sr-fade-up sr-delay-1 rounded-3xl bg-linear-to-br from-slate-900 to-slate-700 p-7 text-white sm:p-10">
        <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-slate-300">
          New Account
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Register and start managing requests like a professional team.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-200">
          Create your customer account in seconds, then log in and submit
          requests to the live board.
        </p>
      </section>

      <section className="sr-glass sr-fade-up sr-delay-2 rounded-3xl p-6 sm:p-8">
        <h2 className="mb-2 text-2xl font-semibold text-slate-900">
          Create account
        </h2>
        <p className="mb-5 text-sm text-slate-600">
          Fill in your details to register.
        </p>
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            className="rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
          <input
            className="rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            type="password"
          />
          <button className="mt-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-strong">
            Create account
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-strong underline"
          >
            Login
          </Link>
        </p>
      </section>
    </div>
  );
}
