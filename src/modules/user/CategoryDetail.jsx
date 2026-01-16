// src/modules/user/CategoryDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Boxes, Calendar, Send, AlertCircle } from "lucide-react";

import { getAssetsByCategory } from "../../services/assets.service";
import { requestLoan } from "../../services/loans.service";
import {
  ASSET_STATUS,
  getAssetStatusLabel,
  getAssetStatusColor,
  getCategoryLabel,
  LOAN_STATUS_LABEL,
} from "../../utils/constants";

/**
 * Props:
 * - category: string (mis. "vehicle" | "electronics" | dst)
 * - userUid: string (firebaseUser.uid)
 * - onBack: function() => void
 */
export default function CategoryDetail({ category, userUid, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(""); // assetId yang sedang diproses request
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // form pengajuan (satu set, untuk asset yang dipilih)
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [startAt, setStartAt] = useState("");
  const [dueAt, setDueAt] = useState("");

  const categoryTitle = useMemo(() => getCategoryLabel(category), [category]);

  const reload = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await getAssetsByCategory(category);
      setItems(data || []);
    } catch (e) {
      setError(e?.message || "Gagal memuat data fasilitas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const canRequest = (asset) => {
    // Aset harus aktif
    if (asset?.isActive === false) return false;

    // Status aset harus AVAILABLE
    if (asset?.status !== ASSET_STATUS.AVAILABLE) return false;

    // Kalau ada reservedStatus atau activeLoanId, artinya sedang ada proses pinjaman
    if (asset?.reservedStatus) return false;
    if (asset?.activeLoanId) return false;

    return true;
  };

  const openRequest = (asset) => {
    setError("");
    setInfo("");
    setSelectedAsset(asset);
    setPurpose("");
    setStartAt("");
    setDueAt("");
  };

  const closeRequest = () => {
    setSelectedAsset(null);
    setPurpose("");
    setStartAt("");
    setDueAt("");
  };

  const submitRequest = async () => {
    setError("");
    setInfo("");

    if (!userUid) {
      setError("User belum terdeteksi. Silakan logout-login lagi.");
      return;
    }
    if (!selectedAsset?.id) {
      setError("Asset belum dipilih.");
      return;
    }
    if (!purpose.trim()) {
      setError("Keperluan peminjaman wajib diisi.");
      return;
    }

    setBusyId(selectedAsset.id);
    try {
      await requestLoan({
        assetId: selectedAsset.id,
        userUid,
        purpose,
        startDate: startAt || null,
        dueDate: dueAt || null,
      });

      setInfo("Pengajuan berhasil dikirim. Menunggu persetujuan admin.");
      closeRequest();
      await reload(); // refresh list (biar lock terlihat)
    } catch (e) {
      setError(e?.message || "Gagal mengajukan pinjaman.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-white p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
            <Boxes size={26} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              Kategori
            </p>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">
              {categoryTitle}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pilih fasilitas yang tersedia lalu ajukan peminjaman.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-2xl bg-slate-100 text-gray-700 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>

      {(error || info) && (
        <div
          className={`px-6 py-4 rounded-3xl border font-bold text-sm flex items-start gap-3 ${
            error
              ? "bg-red-50 border-red-100 text-red-700"
              : "bg-emerald-50 border-emerald-100 text-emerald-700"
          }`}
        >
          <AlertCircle className="mt-0.5" size={18} />
          <div>{error || info}</div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-3xl shadow-xl border border-white p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Daftar Fasilitas
          </p>
          <button
            type="button"
            onClick={reload}
            className="px-4 py-2 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mt-5 rounded-3xl bg-slate-50 border border-slate-100 p-6">
            <p className="font-black text-gray-800">Memuat data...</p>
            <p className="text-sm text-gray-500 mt-2">
              Tenang, ini bukan loading “nanti saja” 😄
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-slate-50 border border-slate-100 p-6">
            <p className="font-black text-gray-800">Belum ada fasilitas di kategori ini.</p>
            <p className="text-sm text-gray-500 mt-2">
              Admin belum menambahkan data inventaris untuk kategori ini.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {items.map((asset) => {
              const statusLabel = getAssetStatusLabel(asset.status);
              const color = getAssetStatusColor(asset.status);
              const reservedLabel = asset.reservedStatus
                ? (LOAN_STATUS_LABEL?.[asset.reservedStatus] || asset.reservedStatus)
                : null;

              const disabled = !canRequest(asset);
              const busy = busyId === asset.id;

              return (
                <div
                  key={asset.id}
                  className="rounded-3xl bg-slate-50 border border-slate-100 p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-900">{asset.name || "(Tanpa Nama)"}</p>
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        {asset.description || "—"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge color={color}>{statusLabel}</Badge>

                        {asset.isActive === false && (
                          <Badge color="slate">Nonaktif</Badge>
                        )}

                        {reservedLabel && (
                          <Badge color="amber">Proses: {reservedLabel}</Badge>
                        )}

                        {asset.location ? (
                          <Badge color="sky">Lokasi: {asset.location}</Badge>
                        ) : null}

                        {asset.code ? <Badge color="slate">Kode: {asset.code}</Badge> : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      disabled={disabled || busy}
                      onClick={() => openRequest(asset)}
                      className={`w-full py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2
                        ${
                          disabled
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                        }`}
                    >
                      <Send size={16} />
                      {busy ? "Memproses..." : "Ajukan Pinjam"}
                    </button>

                    {disabled && (
                      <p className="text-xs text-gray-500 mt-2">
                        Tidak bisa diajukan: aset tidak tersedia / sedang diproses / nonaktif.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Modal (simple inline) */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Ajukan Peminjaman
                </p>
                <p className="text-xl font-black text-gray-900 mt-1">
                  {selectedAsset.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRequest}
                className="px-4 py-2 rounded-2xl bg-slate-100 text-gray-700 font-black uppercase tracking-widest text-xs hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Keperluan
                </label>
                <textarea
                  className="w-full mt-1 px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-emerald-100 font-bold min-h-[110px]"
                  placeholder="Contoh: Kegiatan rapat koordinasi / kunjungan dinas / pelatihan ..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Tanggal Mulai (opsional)
                  </label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-emerald-100 font-bold"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Batas Kembali (opsional)
                  </label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-emerald-100 font-bold"
                      value={dueAt}
                      onChange={(e) => setDueAt(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeRequest}
                className="w-1/2 py-4 rounded-2xl bg-slate-100 text-gray-700 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitRequest}
                disabled={busyId === selectedAsset.id}
                className={`w-1/2 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2
                  ${
                    busyId === selectedAsset.id
                      ? "bg-emerald-400 text-white cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                  }`}
              >
                <Send size={16} />
                {busyId === selectedAsset.id ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ color = "slate", children }) {
  const cls = {
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
    slate: "bg-slate-200 text-slate-700",
  }[color] || "bg-slate-200 text-slate-700";

  return (
    <span className={`px-3 py-1 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cls}`}>
      {children}
    </span>
  );
}
