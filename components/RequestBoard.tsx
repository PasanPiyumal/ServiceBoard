// @ts-nocheck
"use client";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { mutate as globalMutate } from "swr";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import RequestCard from "./RequestCard";
import { readStoredToken } from "../lib/auth-storage";

function getInitialFilterValue(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      "sr_flash_notice",
      JSON.stringify({
        type: "success",
        message: "Job request added successfully.",
      }),
    );
  }
  const params = new URLSearchParams(window.location.search || "");
  const value = params.get(key);
  return value && value.trim() ? value : fallback;
}

const fetcher = async (url: string) => {
  const token = readStoredToken();
  const headers =
    url.includes("mine=true") && token
      ? { authorization: `Bearer ${token}` }
      : {};
  // Debug helper: when ?debug_ui=1 is present, add a short artificial delay
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search || "");
      if (params.get("debug_ui") === "1") {
        await new Promise((res) => setTimeout(res, 1000));
      }
    } catch (e) {}
  }

  const response = await fetch(url, { headers });
  return response.json();
};

type Props = {
  showForm?: boolean; // show create form
  ownerOnly?: boolean; // show only logged-in customer's requests
  statusFilter?: string;
  showDetails?: boolean;
  onCreated?: () => void;
};

type SortOption = "newest" | "oldest" | "status" | "category";

export default function RequestBoard({
  showForm = true,
  ownerOnly = false,
  statusFilter = "all",
  showDetails = true,
  onCreated,
}: Props) {
  const [searchQuery, setSearchQuery] = useState(() =>
    getInitialFilterValue("q", ""),
  );
  const [selectedStatus, setSelectedStatus] = useState(() =>
    getInitialFilterValue("status", statusFilter),
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    () => (getInitialFilterValue("sort", "newest") as SortOption) || "newest",
  );

  useEffect(() => {
    function syncFromUrl() {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search || "");
      setSearchQuery(params.get("q") || "");
      setSelectedStatus(params.get("status") || statusFilter);
      setSortBy((params.get("sort") as SortOption) || "newest");
    }

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [statusFilter]);

  const PAGE_SIZE = 8;

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (ownerOnly) params.set("mine", "true");
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (sortBy !== "newest") params.set("sort", sortBy);

    const queryString = params.toString();
    return queryString ? `/api/requests?${queryString}` : "/api/requests";
  }, [ownerOnly, searchQuery, selectedStatus, sortBy]);

  const qs = requestUrl;

  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search || "");
    setDebugMode(p.get("debug_ui") === "1");
  }, []);

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (
      previousPageData &&
      previousPageData.data &&
      previousPageData.data.length === 0
    )
      return null;
    const sep = qs.includes("?") ? "&" : "?";
    return `${qs}${sep}page=${pageIndex + 1}&limit=${PAGE_SIZE}`;
  };

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(
    getKey,
    fetcher,
  );
  const isLoadingInitialData = !data && !error;
  const isLoading = isLoadingInitialData || isValidating;
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState("Open");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);

  function showNotice(message: string, type: "success" | "error") {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 3500);
  }

  async function submit(e: any) {
    e.preventDefault();
    setIsSubmitting(true);
    // Keep the bearer token optional so anonymous demo requests still work.
    const token = readStoredToken();
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        title,
        description: desc,
        category,
        location,
        contactName,
        contactEmail,
        status,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setTitle("");
      setDesc("");
      setCategory("");
      setLocation("");
      setContactName("");
      setContactEmail("");
      setStatus("Open");
      // Reset to first page and revalidate paged data so new item appears.
      try {
        await setSize(1);
      } catch (e) {}
      await mutate();
      globalMutate("/api/dashboard/stats");
      showNotice("Job request added successfully.", "success");
      if (onCreated) onCreated();
    } else {
      showNotice(json.error || "Failed to create request.", "error");
    }
    setIsSubmitting(false);
  }

  const pages = data || [];
  const requests = pages.flatMap((p: any) => p?.data || []);
  const total = pages[0]?.total ?? requests.length;
  const isReachingEnd =
    data &&
    data[data.length - 1] &&
    data[data.length - 1].data.length < PAGE_SIZE;
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Reset to first page whenever the base request URL (filters/sort) changes
  useEffect(() => {
    setSize(1);
  }, [qs, setSize]);

  // IntersectionObserver to auto-load next page when sentinel enters viewport
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    if (isReachingEnd) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading) {
            setSize((s) => s + 1);
          }
        });
      },
      { rootMargin: "200px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [isReachingEnd, isLoading, setSize]);
  const searchTerms = searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const filteredRequests = requests;

  const hasSearch = searchQuery.trim().length > 0;
  const hasStatusFilter = selectedStatus !== "all";
  const hasSort = sortBy !== "newest";
  const hasAnyFilter = hasSearch || hasStatusFilter || hasSort;

  function pushFilterState(
    nextSearch: string,
    nextStatus: string,
    nextSort: SortOption,
  ) {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search || "");

    if (ownerOnly) params.set("mine", "true");
    else params.delete("mine");

    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    else params.delete("q");

    if (nextStatus !== "all") params.set("status", nextStatus);
    else params.delete("status");

    if (nextSort !== "newest") params.set("sort", nextSort);
    else params.delete("sort");

    const queryString = params.toString();
    const nextUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    pushFilterState(value, selectedStatus, sortBy);
  }

  function handleStatusChange(value: string) {
    setSelectedStatus(value);
    pushFilterState(searchQuery, value, sortBy);
  }

  function handleSortChange(value: SortOption) {
    setSortBy(value);
    pushFilterState(searchQuery, selectedStatus, value);
  }

  function clearAllFilters() {
    setSearchQuery("");
    setSelectedStatus("all");
    setSortBy("newest");
    pushFilterState("", "all", "newest");
  }

  const sortedRequests = [...filteredRequests].sort((left: any, right: any) => {
    if (sortBy === "oldest") {
      return (
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      );
    }

    if (sortBy === "status") {
      const order = { Open: 0, "In Progress": 1, Closed: 2 } as const;
      return (
        (order[left.status as keyof typeof order] ?? 99) -
        (order[right.status as keyof typeof order] ?? 99)
      );
    }

    if (sortBy === "category") {
      return String(left.category || "").localeCompare(
        String(right.category || ""),
      );
    }

    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });

  return (
    <section className="w-full">
      {debugMode ? <div className="sr-debug-banner">UI Debug Mode</div> : null}
      {showForm && (
        <div className="sr-glass sr-fade-up sr-delay-2 mb-6 rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
              Create New Request
            </h2>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
              Live Board
            </span>
          </div>
          {notice ? (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                notice.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-100"
                  : "bg-red-50 text-red-800 border border-red-100"
              }`}
            >
              {notice.message}
            </div>
          ) : null}
          {/* The form mirrors the assessment's JobRequest data model. */}
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Request title"
              className="w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              required
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the request"
              className="w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              rows={3}
              required
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category e.g. Plumbing"
                className="w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                required
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location e.g. Glasgow"
                className="w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact name"
                className="w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Contact email"
                type="email"
                className="w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Status
              </label>
              {/* The assessment requires the request status to be stored with the form submission. */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                required
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                disabled={isSubmitting}
                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Create Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load requests.
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Requests
          </h3>
          <span className="text-sm text-slate-500">
            {isLoading ? "Loading..." : `${total} items`}
          </span>
        </div>

        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end">
          <label className="flex flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Search
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Title, category, location, contact, status"
                className="h-11 w-full rounded-2xl border border-border-soft bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              {hasSearch ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border-soft bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 lg:w-56">
            Status Filter
            <select
              value={selectedStatus}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="h-11 w-full rounded-2xl border border-border-soft bg-white px-3 py-2.5 text-sm font-normal tracking-normal text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            >
              <option value="all">All</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 lg:w-56">
            Sort By
            <select
              value={sortBy}
              onChange={(event) =>
                handleSortChange(event.target.value as SortOption)
              }
              className="h-11 w-full rounded-2xl border border-border-soft bg-white px-3 py-2.5 text-sm font-normal tracking-normal text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="status">Status</option>
              <option value="category">Category</option>
            </select>
          </label>

          {hasAnyFilter ? (
            <div className="flex flex-wrap items-center gap-2 lg:self-end lg:pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
                Active
              </span>
              {hasSearch ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Search: {searchQuery.trim()}
                </span>
              ) : null}
              {hasStatusFilter ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Status: {selectedStatus}
                </span>
              ) : null}
              {hasSort ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Sort:{" "}
                  {sortBy === "oldest"
                    ? "Oldest"
                    : sortBy === "status"
                      ? "Status"
                      : sortBy === "category"
                        ? "Category"
                        : "Newest"}
                </span>
              ) : null}
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-full border border-border-soft bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredRequests.map((r: any, idx: number) => (
          <RequestCard
            key={r._id}
            req={r}
            index={idx}
            showDetails={showDetails}
            highlightTerms={searchTerms}
            debugMode={debugMode}
            onDeleted={(title) =>
              showNotice(`Job card "${title}" deleted successfully.`, "success")
            }
          />
        ))}
      </div>

      {notice ? (
        <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,26rem)] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md">
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              notice.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {notice.message}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-center flex-col gap-3">
        {isLoading && <div className="text-sm text-slate-500">Loading...</div>}

        {!isLoading && requests.length === 0 && (
          <div className="sr-glass mt-4 rounded-2xl p-5 text-sm text-slate-600">
            {hasSearch ? "No requests match your search." : "No requests yet."}
          </div>
        )}

        {requests.length > 0 && (
          <>
            <div ref={loadMoreRef} className="h-6 w-full" />
            {isReachingEnd && (
              <div className="text-sm text-slate-500">End of results</div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
