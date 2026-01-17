// src/modules/admin/AssetsSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Pencil,
  Trash2,
  ClipboardCheck,
} from "lucide-react";

import {
  ASSET_CATEGORIES,
  ASSET_STATUS_FILTER_OPTIONS,
  getCategoryLabel,
  getStatusLabel,
  getStatusOrder,
  normalizeSearchText,
} from "../../utils/constants";

// ✅ FIX: pakai softDeleteAsset (bukan deleteAsset)
import {
  listAssetsByCategory,
  softDeleteAsset,
  // upsertAsset, // nanti dipakai modal tambah/edit
} from "../../services/assets.service";

export default function AssetsSection() {
  const [category, setCategory] = useState("vehicle");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal stub
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // ============ load data ============
  async function reload() {
    setLoading(true);
    try {
      const data = await listAssetsByCategory(category);
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const data = await listAssetsByCategory(category);
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [category]);

  // ============ stats ============
  const stats = useMemo(() => {
    const total = rows.length;
    const by = (key) =>
      rows.filter((r) => (r?.status || "available") === key).length;

    return {
      total,
      available: by("available"),
      borrowed: by("borrowed"),
      requested: by("requested"),
      broken: by("broken"),
      maintenance: by("maintenance"),
    };
  }, [rows]);

  // ============ filter + search + sort ============
  const filtered = useMemo(() => {
    const query = normalizeSearchText(q);
    let out = [...rows];

    // status filter
    if (statusFilter !== "all") {
      out = out.filter((r) => (r?.status || "available") === statusFilter);
    }

    // search
    if (query) {
      out = out.filter((r) => {
        const name = normalizeSearchText(r?.name || r?.nama || "");
        const plate = normalizeSearchText(
          r?.vehiclePlate || r?.plate || r?.nomorPlat || ""
        );
        const nup = normalizeSearchText(
          r?.nupCode || r?.nup || r?.kodeNup || ""
        );
        const borrower = normalizeSearchText(
          r?.borrowerName || r?.currentBorrowerName || r?.peminjam || ""
        );
        const code = normalizeSearchText(r?.code || r?.kode || "");
        return (
          name.includes(query) ||
          plate.includes(query) ||
          nup.includes(query) ||
          borrower.includes(query) ||
          code.includes(query)
        );
      });
    }

    // sort priority
    out.sort((a, b) => {
      const sa = a?.status || "available";
      const sb = b?.status || "available";

      const oa = getStatusOrder(sa);
      const ob = getStatusOrder(sb);
      if (oa !== ob) return oa - ob;

      // sama-sama borrowed => urut loanEndAt paling dekat
      if (sa === "borrowed" && sb === "borrowed") {
        const da = a?.loanEndAt ? new Date(a.loanEndAt).getTime() : Infinity;
        const db = b?.loanEndAt ? new Date(b.loanEndAt).getTime() : Infinity;
        return da - db;
      }

      const na = String(a?.name || a?.nama || "").toLowerCase();
      const nb = String(b?.name || b?.nama || "").toLowerCase();
      return na.localeCompare(nb);
    });

    return out;
  }, [rows, statusFilter, q]);

  // ============ stats click as quick filter ============
  const pickStat = (key) => {
    if (key === "total") {
      setStatusFilter("all");
      return;
    }
    setStatusFilter(key);
  };

  // ============ actions ============
  const onAdd = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const onEdit = (row) => {
    setEditing(row);
    setOpenForm(true);
  };

  const onDelete = async (row) => {
    const ok = window.confirm(
      `Yakin hapus "${row?.name || row?.nama || "-"}"?\n\nCatatan: ini pakai soft delete (nanti bisa kita bikin restore).`
    );
    if (!ok) return;

    // ✅ FIX: pakai softDeleteAsset
    await softDeleteAsset(row.id);

    // reload cepat
    await reload();
  };

  const onExport = () => {
    alert("Export .xlsx: nanti kita pasang di step berikutnya.");
  };

  const onImport = () => {
    alert("Import .xlsx: nanti kita pasang di step berikutnya.");
  };

  const categoryLabel = getCategoryLabel(category);

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">
            INVENTARIS KANTOR
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Kategori:{" "}
            <span className="font-black text-indigo-600">{categoryLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            onClick={onImport}
            className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-widest flex items-center gap-2"
            type="button"
          >
            <Upload size={16} />
            Unggah
          </button>

          <button
            onClick={onExport}
            className="px-4 py-2 rounded-2xl bg-blue-50 text-blue-700 font-black text-xs uppercase tracking-widest flex items-center gap-2"
            type="button"
          >
            <Download size={16} />
            Unduh
          </button>

          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg"
            type="button"
          >
            <Plus size={16} />
            Tambah
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-3xl shadow-xl border border-white p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {ASSET_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition
                ${
                  category === c.key
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-slate-50 text-gray-600 hover:bg-slate-100"
                }`}
              type="button"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          active={statusFilter === "all"}
          title="TOTAL UNIT"
          value={stats.total}
          onClick={() => pickStat("total")}
        />
        <StatCard
          active={statusFilter === "available"}
          title="TERSEDIA"
          value={stats.available}
          onClick={() => pickStat("available")}
        />
        <StatCard
          active={statusFilter === "borrowed"}
          title="DIPINJAM"
          value={stats.borrowed}
          onClick={() => pickStat("borrowed")}
        />
        <StatCard
          active={statusFilter === "requested"}
          title="DALAM ANTRIAN"
          value={stats.requested}
          onClick={() => pickStat("requested")}
        />
        <StatCard
          active={statusFilter === "broken"}
          title="RUSAK"
          value={stats.broken}
          onClick={() => pickStat("broken")}
        />
      </div>

      {/* Search + Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 bg-white rounded-3xl shadow-xl border border-white px-4 py-3 flex items-center gap-3">
          <Search size={18} className="text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, plat, NUP, atau peminjam..."
            className="w-full outline-none text-sm font-semibold text-gray-700 placeholder:text-gray-400"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-white px-4 py-3 flex items-center gap-3">
          <Filter size={18} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full outline-none text-sm font-black text-gray-800 bg-transparent"
          >
            {ASSET_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Daftar Barang
          </p>
          <p className="text-xs font-black text-gray-600">
            {loading ? "Memuat..." : `${filtered.length} item`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <Th>Nama Barang/Fasilitas</Th>
                <Th>Peminjam</Th>
                <Th>Tgl Pinjam</Th>
                <Th>Tgl Kembali</Th>
                <Th>Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-sm text-gray-500" colSpan={6}>
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-6 text-sm text-gray-500" colSpan={6}>
                    Belum ada data untuk kategori ini.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <span className="text-xs font-black text-slate-500">
                            {category === "vehicle"
                              ? "🚗"
                              : category === "electronics"
                              ? "💻"
                              : "📦"}
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-gray-900">
                            {r.name || r.nama || "-"}
                          </p>
                          <p className="text-xs text-gray-500 font-semibold mt-1">
                            {category === "vehicle"
                              ? r.vehiclePlate || r.plate || r.nomorPlat || "-"
                              : r.nupCode || r.nup || r.kodeNup || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-sm font-bold text-gray-700">
                      {r.borrowerName || r.currentBorrowerName || r.peminjam || "-"}
                    </td>

                    <td className="p-5 text-sm font-bold text-gray-700">
                      {r.loanStartAt || r.tglPinjam || "-"}
                    </td>

                    <td className="p-5 text-sm font-black text-gray-900">
                      {r.loanEndAt || r.tglKembali || "-"}
                    </td>

                    <td className="p-5">
                      <StatusPill status={r.status || "available"} />
                    </td>

                    <td className="p-5">
                      <div className="flex items-center justify-end gap-2">
                        {(r.status || "") === "requested" && (
                          <button
                            title="Proses Ajuan"
                            className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center"
                            type="button"
                            onClick={() =>
                              alert("Proses ajuan: nanti kita sambung ke loans flow.")
                            }
                          >
                            <ClipboardCheck size={18} />
                          </button>
                        )}

                        <button
                          title="Edit"
                          className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 border border-slate-100 flex items-center justify-center"
                          type="button"
                          onClick={() => onEdit(r)}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          title="Hapus"
                          className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center"
                          type="button"
                          onClick={() => onDelete(r)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal stub */}
      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-3 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-5">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              {editing ? "Edit" : "Tambah"} — {categoryLabel}
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Form input kategori ini kita bikin setelah ini (dialog sesuai
              kendaraan/elektronik/barang lain).
            </p>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                className="px-5 py-3 rounded-2xl bg-slate-100 text-gray-700 font-black text-xs uppercase tracking-widest"
                type="button"
                onClick={() => setOpenForm(false)}
              >
                Tutup
              </button>
              <button
                className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest"
                type="button"
                onClick={() => alert("Simpan: nanti kita sambungkan ke upsertAsset().")}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`p-4 text-xs font-black uppercase tracking-widest text-gray-400 ${className}`}
    >
      {children}
    </th>
  );
}

function StatCard({ title, value, onClick, active }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`rounded-3xl border p-4 text-left transition shadow-xl
        ${
          active
            ? "bg-slate-800 border-slate-800 text-white"
            : "bg-white border-white"
        }`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-widest ${
          active ? "text-white/70" : "text-gray-400"
        }`}
      >
        {title}
      </p>
      <p className={`mt-2 text-2xl font-black ${active ? "text-white" : "text-gray-900"}`}>
        {value}
      </p>
    </button>
  );
}

function StatusPill({ status }) {
  const label = getStatusLabel(status);

  const map = {
    available: "bg-emerald-50 text-emerald-700 border-emerald-100",
    borrowed: "bg-amber-50 text-amber-700 border-amber-100",
    requested: "bg-indigo-50 text-indigo-700 border-indigo-100",
    broken: "bg-rose-50 text-rose-700 border-rose-100",
    maintenance: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${
        map[status] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {label}
    </span>
  );
}
