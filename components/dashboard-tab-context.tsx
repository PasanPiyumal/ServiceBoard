"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type DashboardTab = "home" | "details";

type DashboardTabContextValue = {
  tab: DashboardTab;
  setTab: (tab: DashboardTab) => void;
};

const DashboardTabContext = createContext<DashboardTabContextValue | null>(
  null,
);

export function DashboardTabProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [tab, setTab] = useState<DashboardTab>("home");

  useEffect(() => {
    function syncTabFromLocation() {
      if (typeof window === "undefined" || !pathname.startsWith("/dashboard")) {
        return;
      }

      const params = new URLSearchParams(window.location.search || "");
      setTab(params.get("tab") === "details" ? "details" : "home");
    }

    syncTabFromLocation();
    window.addEventListener("popstate", syncTabFromLocation);
    return () => window.removeEventListener("popstate", syncTabFromLocation);
  }, [pathname]);

  const value = useMemo(() => ({ tab, setTab }), [tab]);

  return (
    <DashboardTabContext.Provider value={value}>
      {children}
    </DashboardTabContext.Provider>
  );
}

export function useDashboardTab() {
  const context = useContext(DashboardTabContext);
  if (!context) {
    throw new Error("useDashboardTab must be used within DashboardTabProvider");
  }

  return context;
}
