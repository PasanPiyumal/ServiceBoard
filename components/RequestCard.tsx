// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { mutate } from "swr";

type Props = {
  req: any;
  showDetails?: boolean;
  highlightTerms?: string[];
  index?: number;
  debugMode?: boolean;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, terms }: { text: string; terms: string[] }) {
  if (!text || !terms.length) return <>{text}</>;

  const escapedTerms = terms.map(escapeRegExp).filter(Boolean);
  if (!escapedTerms.length) return <>{text}</>;

  const pattern = new RegExp(`(${escapedTerms.join("|")})`, "ig");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark
            key={`${part}-${index}`}
            className="rounded bg-brand/15 px-1 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

export default function RequestCard({
  req,
  showDetails = true,
  highlightTerms = [],
  index = 0,
  debugMode = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [pulseClass, setPulseClass] = useState("");
  const [confirmState, setConfirmState] = useState<null | {
    type: "status" | "delete";
    payload?: any;
  }>(null);
  const userRaw =
    typeof window !== "undefined" ? localStorage.getItem("sr_user") : null;
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isOwner =
    user &&
    req.createdBy &&
    (user.email === req.createdBy.email || user.email === req.customerEmail);
  const ownerKey = "/api/requests?mine=true";
  const boardKey = "/api/requests";

  async function updateStatus(newStatus: string) {
    setConfirmState({ type: "status", payload: newStatus });
    return;
  }

  async function doUpdateStatus(newStatus: string) {
    setConfirmState(null);
    setLoading(true);
    const res = await fetch(`/api/requests/${req._id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.ok) {
      // Revalidate any paged request keys (supports useSWRInfinite keys)
      mutate(
        (key: any) =>
          typeof key === "string" && key.startsWith("/api/requests"),
      );
      mutate("/api/dashboard/stats");
    } else alert(json.error || "Failed");
  }

  async function deleteRequest() {
    setConfirmState({ type: "delete" });
    return;
  }

  async function doDeleteRequest() {
    setConfirmState(null);
    if (!confirm) {
      // just safety, though UI should not allow this path
    }
    setLoading(true);
    const res = await fetch(`/api/requests/${req._id}`, { method: "DELETE" });
    const json = await res.json();
    setLoading(false);
    if (json.ok) {
      mutate(
        (key: any) =>
          typeof key === "string" && key.startsWith("/api/requests"),
      );
      mutate("/api/dashboard/stats");
    } else alert(json.error || "Failed");
  }

  // Add a one-time pulse when the card mounts to draw attention
  useEffect(() => {
    setPulseClass("sr-pulse-once");
    const t = setTimeout(() => setPulseClass(""), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <article
      className={`sr-glass sr-fade-up-strong rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${pulseClass}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {debugMode ? (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
          DBG
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <h3 className="pr-3 text-lg font-semibold text-slate-900">
          <HighlightText text={req.title} terms={highlightTerms} />
        </h3>
        <span className="whitespace-nowrap text-xs text-slate-500">
          {new Date(req.createdAt).toLocaleString()}
        </span>
      </div>
      {showDetails ? (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-700 break-words whitespace-normal">
            <HighlightText text={req.description} terms={highlightTerms} />
          </p>
          {/* The assessment asks for visible job details, so we render them in a structured block. */}
          <div className="mt-4 rounded-2xl border border-border-soft bg-surface-soft/70 p-4">
            <div className="mb-3 flex items-center justify-end gap-3">
              {req.contactEmail ? (
                <span className="text-xs text-slate-500 break-all">
                  {req.contactEmail}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Category
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {req.category ? (
                    <HighlightText text={req.category} terms={highlightTerms} />
                  ) : (
                    "-"
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Location
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {req.location ? (
                    <HighlightText text={req.location} terms={highlightTerms} />
                  ) : (
                    "-"
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Contact Name
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {req.contactName ? (
                    <HighlightText
                      text={req.contactName}
                      terms={highlightTerms}
                    />
                  ) : (
                    "-"
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Contact Email
                </p>
                <p className="mt-1 font-medium text-slate-800 break-all">
                  {req.contactEmail ? (
                    <HighlightText
                      text={req.contactEmail}
                      terms={highlightTerms}
                    />
                  ) : (
                    "-"
                  )}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
          {req.category ? (
            <HighlightText
              text={`${req.category} request`}
              terms={highlightTerms}
            />
          ) : (
            "Service request"
          )}
        </p>
      )}

      {/* Owners can change the job status directly from the card. */}
      {isOwner && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block flex-1">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Change Status
            </span>
            <select
              disabled={loading}
              value={req.status || "Open"}
              onChange={(event) => updateStatus(event.target.value)}
              className="w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </label>

          <button
            disabled={loading}
            onClick={deleteRequest}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Delete
          </button>
        </div>
      )}

      {/* Custom confirmation modal to replace native confirm() */}
      {confirmState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmState(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h4 className="text-lg font-semibold text-slate-900">
              {confirmState.type === "delete"
                ? "Confirm delete"
                : "Confirm status change"}
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              {confirmState.type === "delete"
                ? `Delete request '${req.title}'? This action cannot be undone.`
                : `Mark request '${req.title}' as ${confirmState.payload}?`}
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setConfirmState(null)}
                className="rounded-xl border border-border-soft bg-white px-4 py-2 text-sm"
              >
                Cancel
              </button>
              {confirmState.type === "delete" ? (
                <button
                  onClick={() => doDeleteRequest()}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Delete
                </button>
              ) : (
                <button
                  onClick={() => doUpdateStatus(confirmState.payload)}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
