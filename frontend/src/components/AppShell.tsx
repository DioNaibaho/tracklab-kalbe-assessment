"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Activity,
  History,
  ListChecks,
  LogOut,
  RefreshCw,
  FlaskConical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface UserProfile {
  username: string;
  email: string;
  appDescription?: string;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>({
    username: "assessment.it",
    email: "dev@bifarma.co.id",
  });
  const [requestMenuOpen, setRequestMenuOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("tracklab_user="));
    if (match) {
      try {
        setUser(JSON.parse(decodeURIComponent(match.split("=")[1])));
      } catch {}
    }
  }, []);

  async function handleRefreshToken() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/auth/refresh");
      if (res.ok) {
        alert("Access token berhasil diperbarui & tercatat di .NET Logger!");
      } else {
        alert("Gagal refresh token, silakan login ulang.");
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItemClass = (href: string) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition ${
      pathname === href
        ? "bg-emerald-50 text-emerald-700 font-semibold"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Header */}
          <div className="h-16 px-5 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-lg text-white">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-slate-800 text-base block leading-none">
                TRACKLAB
              </span>
              <span className="text-[11px] text-slate-400">
                Biopharma System
              </span>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="p-4 space-y-6">
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Main Menu
              </p>
              <nav className="space-y-1">
                <Link href="/dashboard" className={navItemClass("/dashboard")}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {/* Expandable Request Menu */}
                <div>
                  <button
                    type="button"
                    onClick={() => setRequestMenuOpen(!requestMenuOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <FileSpreadsheet className="w-4 h-4" />
                      Request
                    </span>
                    {requestMenuOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {requestMenuOpen && (
                    <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-1">
                      <Link
                        href="/request/lab-analysis"
                        className={navItemClass("/request/lab-analysis")}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        Lab Analysis
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/tracking-progress"
                  className={navItemClass("/tracking-progress")}
                >
                  <Activity className="w-4 h-4" />
                  Tracking Progress
                </Link>

                <Link
                  href="/data-history"
                  className={navItemClass("/data-history")}
                >
                  <History className="w-4 h-4" />
                  Data History (.NET Logs)
                </Link>
              </nav>
            </div>

            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Master
              </p>
              <nav className="space-y-1">
                <Link
                  href="/master/tracker"
                  className={navItemClass("/master/tracker")}
                >
                  <ListChecks className="w-4 h-4" />
                  Tracker
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Brand Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="text-sm font-bold tracking-tight">
            <span className="text-emerald-700">Pharma</span>
            <span className="text-red-500 italic">Metric</span>
            <span className="text-emerald-700">Labs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            PT Kalbe Farma Tbk
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Environment:{" "}
            <span className="font-semibold text-emerald-700">
              {user.appDescription || "Biopharma Assessment"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshToken}
              disabled={refreshing}
              title="Test Refresh Token Endpoint"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh Token
            </button>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-slate-800">
                  {user.username}
                </p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center uppercase">
                {user.username.slice(0, 2)}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}