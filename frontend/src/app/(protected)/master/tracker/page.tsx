"use client";

import { useCallback, useEffect, useState } from "react";
import { MasterTracker } from "@/types/tracklab";
import { buildKalbePagingHeaders } from "@/lib/pagination";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  ArrowUpDown,
} from "lucide-react";

const EMPTY_FORM: Partial<MasterTracker> = {
  code: "",
  parent_code: "",
  description: "",
  order: 0,
  icon: "none",
  action_type: "none",
  module_flow: "CA",
  mandays: 0,
  is_parallel: false,
  is_public: false,
  is_using_notification: false,
  is_active: true,
};

export default function MasterTrackerPage() {
  const [items, setItems] = useState<MasterTracker[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MasterTracker>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MasterTracker | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchTrackers = useCallback(async () => {
    setLoading(true);
    try {
      const pagingHeaders = buildKalbePagingHeaders({
        offset,
        limit,
        sortBy,
        sortOrder,
        search,
      });

      const res = await fetch("/api/feature/trackers", {
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
    fetchTrackers();
  }, [fetchTrackers]);

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(item: MasterTracker) {
    setEditingId(item.id);
    setForm({ ...item, parent_code: item.parent_code || "" });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        parent_code: form.parent_code?.trim() || null,
        order: Number(form.order) || 0,
        mandays: Number(form.mandays) || 0,
      };

      const res = await fetch("/api/feature/trackers", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });

      if (res.ok) {
        setModalOpen(false);
        showToast(
          editingId
            ? "Master Tracker berhasil diperbarui!"
            : "Master Tracker baru berhasil ditambahkan!"
        );
        fetchTrackers();
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/feature/trackers?id=${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteTarget(null);
      showToast(`Tracker ${deleteTarget.code} berhasil dihapus.`);
      fetchTrackers();
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
          <h1 className="text-xl font-bold text-slate-800">Master Tracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage tracker data (m_trackers)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Tracker
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
            placeholder="Search code, description, flow..."
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
                <th className="py-3 px-3 text-center">Action</th>
                <th
                  onClick={() => toggleSort("code")}
                  className="py-3 px-3 cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    Code <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-3">Parent Code</th>
                <th
                  onClick={() => toggleSort("description")}
                  className="py-3 px-3 cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    Description <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("order")}
                  className="py-3 px-3 text-center cursor-pointer select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    Order <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-3">Icon</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Module Flow</th>
                <th className="py-3 px-3 text-center">Mandays</th>
                <th className="py-3 px-3 text-center">Parallel</th>
                <th className="py-3 px-3 text-center">Public</th>
                <th className="py-3 px-3 text-center">Notification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    Memuat Master Tracker...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    Data tracker tidak ditemukan.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
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
                    <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {item.code}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {item.parent_code || "-"}
                    </td>
                    <td className="py-2.5 px-3">{item.description}</td>
                    <td className="py-2.5 px-3 text-center font-semibold">
                      {item.order}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{item.icon}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {item.action_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      {item.module_flow}
                    </td>
                    <td className="py-2.5 px-3 text-center">{item.mandays}</td>
                    <td className="py-2.5 px-3 text-center">
                      {item.is_parallel ? (
                        <Check className="w-4 h-4 text-emerald-600 inline" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400 inline" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.is_public ? (
                        <Check className="w-4 h-4 text-emerald-600 inline" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400 inline" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.is_using_notification ? (
                        <Check className="w-4 h-4 text-emerald-600 inline" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400 inline" />
                      )}
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
              {editingId ? "Edit Master Tracker" : "Add Master Tracker"}
            </h2>
            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Code *
                  </label>
                  <input
                    required
                    value={form.code || ""}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="REQ-VERIFY"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Parent Code
                  </label>
                  <input
                    value={form.parent_code || ""}
                    onChange={(e) =>
                      setForm({ ...form, parent_code: e.target.value })
                    }
                    placeholder="REQ-CREATE"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Description *
                </label>
                <input
                  required
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Verified Request"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Action Type
                  </label>
                  <select
                    value={form.action_type || "none"}
                    onChange={(e) =>
                      setForm({ ...form, action_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="none">none</option>
                    <option value="text">text</option>
                    <option value="file">file</option>
                    <option value="date">date</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Module Flow
                  </label>
                  <input
                    value={form.module_flow || "CA"}
                    onChange={(e) =>
                      setForm({ ...form, module_flow: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Icon
                  </label>
                  <input
                    value={form.icon || "none"}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={form.order ?? 0}
                    onChange={(e) =>
                      setForm({ ...form, order: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mandays
                  </label>
                  <input
                    type="number"
                    value={form.mandays ?? 0}
                    onChange={(e) =>
                      setForm({ ...form, mandays: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.is_parallel}
                    onChange={(e) =>
                      setForm({ ...form, is_parallel: e.target.checked })
                    }
                  />
                  Is Parallel
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.is_public}
                    onChange={(e) =>
                      setForm({ ...form, is_public: e.target.checked })
                    }
                  />
                  Is Public
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.is_using_notification}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        is_using_notification: e.target.checked,
                      })
                    }
                  />
                  Use Notification
                </label>
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
                  Save Tracker
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
              Hapus Master Tracker?
            </h3>
            <p className="text-xs text-slate-600">
              Data tracker <strong>{deleteTarget.code}</strong> akan dihapus dan
              dicatat ke audit log .NET.
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