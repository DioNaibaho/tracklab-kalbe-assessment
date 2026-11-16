"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  FileSpreadsheet,
  Activity,
  History,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const [authData, setAuthData] = useState<unknown>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setAuthData(data.authorization))
      .catch(() => {});
  }, []);

  const cards = [
    {
      title: "Master Trackers",
      desc: "Kelola master tahapan workflow lab (m_trackers)",
      href: "/master/tracker",
      icon: ListChecks,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Lab Analysis Request",
      desc: "Kelola transaksi permintaan analisis (t_request_headers)",
      href: "/request/lab-analysis",
      icon: FileSpreadsheet,
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Tracking Progress",
      desc: "Kelola progres tracking tiap request (t_trackings)",
      href: "/tracking-progress",
      icon: Activity,
      color: "bg-amber-50 text-amber-700",
    },
    {
      title: "Data History (.NET Logs)",
      desc: "Audit trail real-time dari backend ASP.NET Core",
      href: "/data-history",
      icon: History,
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard TRACKLAB
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Sistem Manajemen & Tracking Analisis Laboratorium — Kalbe Biopharma
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition flex flex-col justify-between group"
            >
              <div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-slate-800 mt-4 group-hover:text-emerald-700 transition">
                  {card.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                Buka Modul <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Live Authorization Payload from Kalbe API */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800 text-sm">
            Kalbe API Authorization Scope (/auth/authorization?nested=false)
          </h3>
        </div>
        <pre className="bg-slate-900 text-emerald-300 text-xs p-4 rounded-lg overflow-auto max-h-60">
          {authData
            ? JSON.stringify(authData, null, 2)
            : "Memuat data authorization dari API Kalbe..."}
        </pre>
      </div>
    </div>
  );
}