// src/modules/admin/AssetsSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

import { useAssets } from "../../hooks/useAssets";
import AssetFormModal from "./AssetFormModal";

// ===== helpers: id, number, csv parse, mapping =====
function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `asset_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toNumber(v, fallback = 0) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

// CSV parser (support quoted commas, "" escape)
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }

    if (c === ",") {
      row.push(cur);
      cur = "";
      continue;
    }

    if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }

    if (c === "\r") continue;

    cur += c;
  }

  // last cell
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }

  // trim empty trailing lines
  return rows.filter((r) => r.some((x) => String(x || "").trim() !== ""));
}

function mapRowToPayload(headers, values, fallbackCategory) {
  const get = (key) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? values[idx] : "";
  };

  // header alias map (biar fleksibel)
  const h = (aliases) => {
    for (const a of aliases) {
      const v = get(a);
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
  };

  const category =
    String(h(["category", "kategori"]) || fallbackCategory || "others").trim() || "others";

  const payload = {
    id: String(h(["id"]))?.trim() || makeId(),
    category,

    name: String(h(["name", "nama"]))?.trim(),
    code: String(h(["code", "kode"]))?.trim(),
    location: String(h(["location", "lokasi"]))?.trim(),
    condition: String(h(["condition", "kondisi"]))?.trim(),
    qty: Math.max(1, toNumber(h(["qty", "jumlah", "stok"]), 1)),
    status: String(h(["status"]))?.trim() || "available",
    photoUrl: String(h(["photourl", "foto", "fotourl", "urlfoto", "photo"]))?.trim(),

    // vehicle
    vehiclePlate: String(h(["vehicleplate", "plate", "nomorplat"]))?.trim(),
    chassisNumber: String(h(["chassisnumber", "nomorrangka"]))?.trim(),
    engineNumber: String(h(["enginenumber", "nomormesin"]))?.trim(),
    oilEngineAt: String(h(["oilengineat", "tglgantiolimesin"]))?.trim() || null,
    oilEngineNextAt: String(h(["oilenginenextat", "tglgantiolimesinberikutnya"]))?.trim() || null,
    oilGearAt: String(h(["oilgearat", "tglgantioliperseneling"]))?.trim() || null,
    oilGearNextAt: String(h(["oilgearnextat", "tglgantiolipersenelingberikutnya"]))?.trim() || null,
    taxNextAt: String(h(["taxnextat", "tglbayarpajakberikutnya"]))?.trim() || null,

    // electronics/others
    nupCode: String(h(["nupcode", "nup", "kodenup"]))?.trim(),
    brand: String(h(["brand", "merk"]))?.trim(),
    specs: String(h(["specs", "spesifikasi", "spesifikasidetail"]))?.trim(),

    isDeleted: false,
  };

  return payload;
}

export default function AssetsSection() {
  const {
    category,
    setCategory,
    rows,
    loading,
    busy,
    error,
    reload,
    saveAsset,
    removeAsset,
  } = useAssets("vehicle");

  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  // modal
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // import state
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  // reset filter/search saat ganti kategori
  useEffect(() => {
    setStatusFilter("all");
    setQ("");
  }, [category]);

  const categoryLabel = getCategoryLabel(category);

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
    const queryText = normalizeSearchText(q);
    let out = [...rows];

    if (statusFilter !== "all") {
      out = out.filter((r) => (r?.status || "available") === statusFilter);
    }

    if (queryText) {
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
          name.includes(queryText) ||
          plate.includes(queryText) ||
          nup.includes(queryText) ||
          borrower.includes(queryText) ||
          code.includes(queryText)
        );
      });
    }

    out.sort((a, b) => {
      const sa = a?.status || "available";
      const sb = b?.status || "available";

      const oa = getStatusOrder(sa);
      const ob = getStatusOrder(sb);
      if (oa !== ob) return oa - ob;

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

  // ============ Export CSV (Excel bisa buka) ============
  const exportCSV = () => {
    const headers = [
      "id",
      "category",
      "name",
      "code",
      "location",
      "condition",
      "qty",
      "status",
      "photoUrl",
      "vehiclePlate",
      "nupCode",
      "brand",
      "specs",
      "chassisNumber",
      "engineNumber",
      "oilEngineAt",
      "oilEngineNextAt",
      "oilGearAt",
      "oilGearNextAt",
      "taxNextAt",
      "borrowerName",
      "loanStartAt",
      "loanEndAt",
    ];

    const esc = (v) => {
      const s = v == null ? "" : String(v);
      if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replaceAll('"', '""')}"`;
      }
      return s;
    };

    const lines = [
      headers.join(","),
      ...filtered.map((r) => headers.map((h) => esc(r?.[h])).join(",")),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `assets_${category}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  // ============ Import CSV ============
  const onImportClick = () => {
    setImportMsg("");
    fileRef.current?.click();
  };

  const handleImportFile = async (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv")) {
      setImportMsg("File harus .csv ya sob 😄");
      return;
    }

    setImporting(true);
    setImportMsg("");

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (!parsed.length || parsed.length < 2) {
        setImportMsg("CSV kosong atau tidak ada data baris.");
        return;
      }

      const rawHeaders = parsed[0];
      const headers = rawHeaders.map((x) => normalizeHeader(x));
      const dataRows = parsed.slice(1);

      // minimal column check: name/nama harus ada
      const hasName = headers.includes("name") || headers.includes("nama");
      if (!hasName) {
        setImportMsg('Header wajib punya kolom "name" atau "nama".');
        return;
      }

      // proses dengan batch kecil biar aman
      const payloads = dataRows
        .map((row) => mapRowToPayload(headers, row, category))
        .filter((p) => p?.name && String(p.name).trim() !== "");

      if (!payloads.length) {
        setImportMsg("Tidak ada baris valid (name kosong semua).");
        return;
      }

      let ok = 0;
      let fail = 0;
      const errors = [];

      const BATCH = 10;
      for (let i = 0; i < payloads.length; i += BATCH) {
        const chunk = payloads.slice(i, i + BATCH);

        const results = await Promise.all(
          chunk.map(async (p, idx) => {
            try {
              const res = await saveAsset(p); // hook -> service
              return { ok: !!res, err: null, p };
            } catch (e) {
              return { ok: false, err: e, p };
            }
          })
        );

        results.forEach((r) => {
          if (r.ok) ok += 1;
          else {
            fail += 1;
            errors.push({
              name: r.p?.name,
              message: r.err?.message || "Unknown error",
            });
          }
        });
      }

      await reload();

      if (fail === 0) {
        setImportMsg(`✅ Import selesai: ${ok} item berhasil.`);
      } else {
        setImportMsg(
          `⚠️ Import selesai: ${ok} berhasil, ${fail} gagal. (Cek console untuk detail)`
        );
        // biar gampang debug
        console.warn("Import CSV errors:", errors);
      }
    } catch (e) {
      setImportMsg(e?.message || "Gagal membaca CSV.");
    } finally {
      setImporting(false);
      // reset input supaya bisa upload file yang sama lagi
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ============ stats click ============
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
      `Yakin hapus "${row?.name || row?.nama || "-"}"?\n\nCatatan: ini soft delete (nanti bisa restore).`
    );
    if (!ok) return;
    await removeAsset(row.id);
  };

  const onExport = () => exportCSV();

  return (
    <div className="space-y-4">
      {/* hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleImportFile(e.target.files?.[0])}
      />

      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">
            INVENTARIS KANTOR
          </h2>

          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">
              Kategori:{" "}
              <span className="font-black text-indigo-600">{categoryLabel}</span>
            </p>

            {(loading || busy || importing) && (
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {importing ? "Import..." : busy ? "Memproses..." : "Memuat..."}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            onClick={onImportClick}
            disabled={busy || importing}
            className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
            type="button"
          >
            <Upload size={16} />
            Unggah CSV
          </button>

          <button
            onClick={onExport}
            disabled={busy || loading || importing}
            className="px-4 py-2 rounded-2xl bg-blue-50 text-blue-700 font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
            type="button"
          >
            <Download size={16} />
            Unduh CSV
          </button>

          <button
            onClick={onAdd}
            disabled={busy || importing}
            className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-60"
            type="button"
          >
            <Plus size={16} />
            Tambah
          </button>

          <button
            onClick={reload}
            disabled={busy || loading || importing}
            className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error / Import message */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
          {error}
        </div>
      ) : null}

      {importMsg ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 text-sm font-bold">
          {importMsg}
        </div>
      ) : null}

      {/* Category Tabs */}
      <div className="bg-white rounded-3xl shadow-xl border border-white p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {ASSET_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              disabled={busy || importing}
              className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition disabled:opacity-60
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
          disabled={busy || importing}
          active={statusFilter === "all"}
          title="TOTAL UNIT"
          value={stats.total}
          onClick={() => pickStat("total")}
        />
        <StatCard
          disabled={busy || importing}
          active={statusFilter === "available"}
          title="TERSEDIA"
          value={stats.available}
          onClick={() => pickStat("available")}
        />
        <StatCard
          disabled={busy || importing}
          active={statusFilter === "borrowed"}
          title="DIPINJAM"
          value={stats.borrowed}
          onClick={() => pickStat("borrowed")}
        />
        <StatCard
          disabled={busy || importing}
          active={statusFilter === "requested"}
          title="DALAM ANTRIAN"
          value={stats.requested}
          onClick={() => pickStat("requested")}
        />
        <StatCard
          disabled={busy || importing}
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
                      {r.borrowerName ||
                        r.currentBorrowerName ||
                        r.peminjam ||
                        "-"}
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
                            disabled={busy || importing}
                            className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center disabled:opacity-60"
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
                          disabled={busy || importing}
                          className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 border border-slate-100 flex items-center justify-center disabled:opacity-60"
                          type="button"
                          onClick={() => onEdit(r)}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          title="Hapus"
                          disabled={busy || importing}
                          className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center disabled:opacity-60"
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

      {/* Modal Form */}
      <AssetFormModal
        open={openForm}
        category={category}
        initialData={editing}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        onSubmit={async (payload) => {
          const ok = await saveAsset(payload);
          if (ok) {
            setOpenForm(false);
            setEditing(null);
          }
        }}
      />
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

function StatCard({ title, value, onClick, active, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`rounded-3xl border p-4 text-left transition shadow-xl disabled:opacity-60
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
      <p
        className={`mt-2 text-2xl font-black ${
          active ? "text-white" : "text-gray-900"
        }`}
      >
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
