// @ts-nocheck
"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Props = {
  mineOnly?: boolean;
};

export default function DashboardStats({ mineOnly = false }: Props) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("sr_token") : null;
  const url = mineOnly ? "/api/dashboard/stats" : "/api/requests";
  const { data, error, isLoading } = useSWR(url, (endpoint: string) =>
    fetch(endpoint, {
      headers: mineOnly && token ? { authorization: `Bearer ${token}` } : {},
    }).then((res) => res.json()),
  );

  const stats = mineOnly
    ? data?.data || {
        total: 0,
        open: 0,
        inProgress: 0,
        closed: 0,
        categories: 0,
        locations: 0,
        contacts: 0,
      }
    : (() => {
        const requests = data?.data || [];
        const total = requests.length;
        const open = requests.filter(
          (request: any) => request.status !== "Closed",
        ).length;
        const customers = new Set(
          requests
            .map(
              (request: any) =>
                request.contactEmail || request.createdBy?.email,
            )
            .filter(Boolean),
        ).size;

        return { total, open, customers };
      })();

  const statItems = mineOnly
    ? [
        { label: "Open", value: stats.open, helper: "Need attention" },
        {
          label: "In Progress",
          value: stats.inProgress,
          helper: "Being handled",
        },
        { label: "Closed", value: stats.closed, helper: "Completed work" },
      ]
    : [
        { label: "Open Requests", value: stats.open, helper: "Need attention" },
        {
          label: "Total Requests",
          value: stats.total,
          helper: "All submissions",
        },
        {
          label: "Customers",
          value: stats.customers,
          helper: "Unique requesters",
        },
      ];

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className={`sr-glass sr-fade-up rounded-2xl p-5 ${index === 0 ? "sr-delay-1" : index === 1 ? "sr-delay-2" : "sr-delay-3"}`}
        >
          <div className="text-sm font-medium text-slate-500">{item.label}</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {isLoading ? "—" : error ? "!" : item.value}
          </div>
          <p className="mt-1 text-xs text-slate-500">{item.helper}</p>
        </div>
      ))}
    </section>
  );
}
