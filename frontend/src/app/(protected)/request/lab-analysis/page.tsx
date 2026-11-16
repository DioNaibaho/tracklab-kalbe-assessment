"use client";

import { useCallback, useEffect, useState } from "react";
import { RequestHeader } from "@/types/tracklab";
import { buildKalbePagingHeaders } from "@/lib/pagination";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  ArrowUpDown,
} from "lucide-react";

const EMPTY_FORM: Partial<RequestHeader> = {
  company_name: "PT KALBE FARMA TBK",
  partner_id: "PTN-KALBE-001",
  project_code: "",
  last_status: "Not sent yet",
  receiving_status: "Not received yet",
  total_fee: 0,
  lead_time: 7,
  received_date: "",
  analysis_wip_date: "",
  analysis_completed_date: "",
  is_active: true,
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function LabAnalysisRequestPage() {
  const [items, setItems] = useState<RequestHeader[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_on");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<RequestHeader>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RequestHeader | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const pagingHeaders = buildKalbePagingHeaders({
        offset,
        limit,
        sortBy,
        sortOrder,
        search,
      });

      const res = await fetch("/api/feature/requests", {
        headers: pagingHeaders,
      });
      const json = await res.json();
      if (json.success) {
        setItems(json.data?.items || []);
        setTotalItems(json.data?.totalItems || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [offset, limit, sortBy, sortOrder, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function openAddModal() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      project_code: `PRJ-${Date.now().toString().slice(-6)}`,
    });
    setModalOpen(true);
  }

  function openEditModal(item: RequestHeader) {
    setEditingId(item.id);
    setForm({
      ...item,
      received_date: item.received_date || "",
      analysis_wip_date: item.analysis_wip_date || "",
      analysis_completed_date: item.analysis_completed_date || "",
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        total_fee: Number(form.total_fee) || 0,
        lead_time: Number(form.lead_time) || 0,
        received_date: form.received_date || null,
        analysis_wip_date: form.analysis_wip_date || null,
        analysis_completed_date: form.analysis_completed_date || null,
      };

      const res = await fetch("/api/feature/requests", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });

      if (res.ok) {
        setModalOpen(false);
        showToast(
          editingId
            ? "Lab Analysis Request berhasil diperbarui!"
            : "Lab Analysis Request baru berhasil dibuat!"
        );
        fetchRequests();
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/feature/requests?id=${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteTarget(null);
      showToast(`Request ${deleteTarget.project_code} berhasil dihapus.`);
      fetchRequests();
    }
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  }

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Lab Analysis Request
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage all data (t_request_headers)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Request
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setOffset(0);
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="Search project code, status, company..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-700 text-white uppercase tracking-wider">
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Company Name</th>
                <th
                  onClick={() => toggleSort("project_code")}
                  className="py-3 px-4 cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    Project Code <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("created_on")}
                  className="py-3 px-4 cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    Request Date <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-4">Last Status</th>
                <th className="py-3 px-4">Receiving Status</th>
                <th
                  onClick={() => toggleSort("total_fee")}
                  className="py-3 px-4 cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    Total Fee <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data Lab Analysis Request...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Data request tidak ditemukan.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {item.id.slice(0, 18)}...
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.company_name || "PT KALBE FARMA TBK"}
                    </td>
                    <td className="py-3 px-4 font-medium text-emerald-700">
                      {item.project_code}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(item.created_on).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                        {item.last_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.receiving_status}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {formatRupiah(item.total_fee)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing {totalItems === 0 ? 0 : offset + 1} to{" "}
            {Math.min(offset + limit, totalItems)} of {totalItems} entries
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 rounded bg-emerald-700 text-white font-semibold">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={offset + limit >= totalItems}
              onClick={() => setOffset(offset + limit)}
              className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-800">
              {editingId ? "Edit Lab Analysis Request" : "New Lab Analysis Request"}
            </h2>
            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Project Code *
                  </label>
                  <input
                    required
                    value={form.project_code || ""}
                    onChange={(e) =>
                      setForm({ ...form, project_code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Partner ID *
                  </label>
                  <input
                    required
                    value={form.partner_id || ""}
                    onChange={(e) =>
                      setForm({ ...form, partner_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Company Name
                </label>
                <input
                  value={form.company_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, company_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Last Status
                  </label>
                  <input
                    value={form.last_status || ""}
                    onChange={(e) =>
                      setForm({ ...form, last_status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Receiving Status
                  </label>
                  <input
                    value={form.receiving_status || ""}
                    onChange={(e) =>
                      setForm({ ...form, receiving_status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Total Fee (IDR)
                  </label>
                  <input
                    type="number"
                    value={form.total_fee ?? 0}
                    onChange={(e) =>
                      setForm({ ...form, total_fee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    value={form.lead_time ?? 7}
                    onChange={(e) =>
                      setForm({ ...form, lead_time: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Received Date
                  </label>
                  <input
                    type="date"
                    value={form.received_date || ""}
                    onChange={(e) =>
                      setForm({ ...form, received_date: e.target.value })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    WIP Date
                  </label>
                  <input
                    type="date"
                    value={form.analysis_wip_date || ""}
                    onChange={(e) =>
                      setForm({ ...form, analysis_wip_date: e.target.value })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Completed Date
                  </label>
                  <input
                    type="date"
                    value={form.analysis_completed_date || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        analysis_completed_date: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
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
                  Save Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              Hapus Request Analisis?
            </h3>
            <p className="text-xs text-slate-600">
              Project <strong>{deleteTarget.project_code}</strong> akan dihapus
              secara permanen dan dicatat ke audit log .NET.
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