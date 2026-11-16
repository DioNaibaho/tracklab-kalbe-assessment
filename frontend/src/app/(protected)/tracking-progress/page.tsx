"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MasterTracker,
  RequestHeader,
  TransactionTracking,
} from "@/types/tracklab";
import { buildKalbePagingHeaders } from "@/lib/pagination";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";

const EMPTY_FORM: Partial<TransactionTracking> = {
  request_id: "",
  tracker_id: "",
  value: "",
  partner_id: "PTN-KALBE-001",
  is_active: true,
};

export default function TrackingProgressPage() {
  const [items, setItems] = useState<TransactionTracking[]>([]);
  const [trackers, setTrackers] = useState<MasterTracker[]>([]);
  const [requests, setRequests] = useState<RequestHeader[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<TransactionTracking>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransactionTracking | null>(
    null
  );
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [trkRes, reqRes, ttrRes] = await Promise.all([
        fetch("/api/feature/trackers", {
          headers: buildKalbePagingHeaders({ limit: 100 }),
        }),
        fetch("/api/feature/requests", {
          headers: buildKalbePagingHeaders({ limit: 100 }),
        }),
        fetch("/api/feature/trackings", {
          headers: buildKalbePagingHeaders({
            limit: 100,
            sortBy: "created_on",
            sortOrder: "DESC",
            search,
          }),
        }),
      ]);

      const [trkJson, reqJson, ttrJson] = await Promise.all([
        trkRes.json(),
        reqRes.json(),
        ttrRes.json(),
      ]);

      setTrackers(trkJson.data?.items || []);
      setRequests(reqJson.data?.items || []);
      setItems(ttrJson.data?.items || []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function openAddModal() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      request_id: requests[0]?.id || "",
      tracker_id: trackers[0]?.id || "",
    });
    setModalOpen(true);
  }

  function openEditModal(item: TransactionTracking) {
    setEditingId(item.id);
    setForm({ ...item });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/feature/trackings", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });

      if (res.ok) {
        setModalOpen(false);
        showToast(
          editingId
            ? "Tracking progress diperbarui!"
            : "Tracking progress baru ditambahkan!"
        );
        fetchAll();
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/feature/trackings?id=${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteTarget(null);
      showToast("Data tracking berhasil dihapus.");
      fetchAll();
    }
  }

  const getTrackerLabel = (id: string) => {
    const found = trackers.find((t) => t.id === id);
    return found ? `${found.code} — ${found.description}` : id;
  };

  const getProjectLabel = (id: string) => {
    const found = requests.find((r) => r.id === id);
    return found ? found.project_code : id.slice(0, 12);
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Tracking Progress (Bonus Feature)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola tahapan progres tiap Lab Analysis Request (t_trackings)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Tracking Step
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari value, partner ID, atau tracker..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-700 text-white uppercase tracking-wider">
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4">Project Code (Request)</th>
                <th className="py-3 px-4">Tracker Stage</th>
                <th className="py-3 px-4">Tracking Value / Notes</th>
                <th className="py-3 px-4">Partner ID</th>
                <th className="py-3 px-4">Updated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat data tracking...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada data tracking progress.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {getProjectLabel(item.request_id)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {getTrackerLabel(item.tracker_id)}
                    </td>
                    <td className="py-3 px-4">{item.value}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.partner_id}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.last_updated_by}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-800">
              {editingId ? "Edit Tracking Progress" : "Add Tracking Progress"}
            </h2>
            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Lab Analysis Request *
                </label>
                <select
                  required
                  value={form.request_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, request_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.project_code} — {r.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tracker Stage *
                </label>
                <select
                  required
                  value={form.tracker_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, tracker_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {trackers.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.order}] {t.code} — {t.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Value / Notes *
                </label>
                <input
                  required
                  value={form.value || ""}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="Contoh: Sample diterima oleh Lab QC"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Partner ID
                </label>
                <input
                  value={form.partner_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, partner_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              Hapus Tracking Progress?
            </h3>
            <p className="text-xs text-slate-600">
              Data tracking ini akan dihapus dan dicatat ke audit log .NET.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}