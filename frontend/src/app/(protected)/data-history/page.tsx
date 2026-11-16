"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityLogItem } from "@/types/tracklab";
import { RefreshCw, Search } from "lucide-react";

export default function DataHistoryPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (search) params.set("search", search);
      if (moduleFilter) params.set("module", moduleFilter);

      const res = await fetch(`/api/logs?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal mengambil log dari .NET");
        setLogs([]);
      } else {
        setLogs(json.data?.items || []);
      }
    } catch {
      setError("Koneksi ke backend .NET (port 5050) terputus");
    } finally {
      setLoading(false);
    }
  }, [search, moduleFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Data History (Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Riwayat aktivitas aplikasi yang tercatat secara real-time di Backend .NET (SQLite)
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari user, action, atau detail..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="">Semua Module</option>
          <option value="AUTH">AUTH</option>
          <option value="TRACKERS">TRACKERS</option>
          <option value="REQUESTS">REQUESTS</option>
          <option value="TRACKINGS">TRACKINGS</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-emerald-700 text-white text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat data log dari .NET...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada log aktivitas tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {log.username}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded ${
                          log.action === "DELETE"
                            ? "bg-red-100 text-red-700"
                            : log.action === "CREATE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-semibold text-emerald-700">
                        {log.statusCode}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}