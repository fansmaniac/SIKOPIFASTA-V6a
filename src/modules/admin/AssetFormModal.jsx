// src/modules/admin/AssetFormModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const STATUS_OPTIONS = [
  { key: "available", label: "Tersedia" },
  { key: "borrowed", label: "Dipinjam" },
  { key: "requested", label: "Dalam Antrian" },
  { key: "broken", label: "Rusak" },
  { key: "maintenance", label: "Maintenance" },
];

function makeId() {
  // untuk browser modern
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // fallback
  return `asset_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toISODateInput(v) {
  if (!v) return "";
  // kalau sudah "YYYY-MM-DD"
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AssetFormModal({
  open,
  onClose,
  onSubmit, // (payload) => Promise<void> atau void
  category = "vehicle", // vehicle | electronics | others
  initialData = null, // row yang diedit
}) {
  const isEdit = !!initialData?.id;

  const title = useMemo(() => {
    const cat =
      category === "vehicle"
        ? "Kendaraan Dinas"
        : category === "electronics"
        ? "Peralatan Elektronik"
        : "Barang Lainnya";
    return `${isEdit ? "Edit" : "Tambah"} — ${cat}`;
  }, [category, isEdit]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    // common
    id: "",
    category,
    name: "",
    code: "",
    location: "",
    condition: "",
    qty: 1,
    status: "available",
    photoUrl: "",

    // vehicle
    vehiclePlate: "",
    chassisNumber: "",
    engineNumber: "",
    oilEngineAt: "",
    oilEngineNextAt: "",
    oilGearAt: "",
    oilGearNextAt: "",
    taxNextAt: "",

    // electronics/others
    nupCode: "",
    brand: "",
    specs: "",
  });

  // hydrate dari initialData
  useEffect(() => {
    if (!open) return;

    const d = initialData || {};
    setErr("");

    setForm((prev) => ({
      ...prev,
      id: d.id || "",
      category: d.category || category,

      name: d.name || d.nama || "",
      code: d.code || d.kode || "",
      location: d.location || d.lokasi || "",
      condition: d.condition || d.kondisi || "",
      qty: Number(d.qty ?? d.jumlah ?? 1) || 1,
      status: d.status || "available",
      photoUrl: d.photoUrl || d.fotoUrl || "",

      vehiclePlate: d.vehiclePlate || d.plate || d.nomorPlat || "",
      chassisNumber: d.chassisNumber || d.nomorRangka || "",
      engineNumber: d.engineNumber || d.nomorMesin || "",
      oilEngineAt: toISODateInput(d.oilEngineAt || d.tglGantiOliMesin),
      oilEngineNextAt: toISODateInput(
        d.oilEngineNextAt || d.tglGantiOliMesinBerikutnya
      ),
      oilGearAt: toISODateInput(d.oilGearAt || d.tglGantiOliPerseneling),
      oilGearNextAt: toISODateInput(
        d.oilGearNextAt || d.tglGantiOliPersenelingBerikutnya
      ),
      taxNextAt: toISODateInput(d.taxNextAt || d.tglBayarPajakBerikutnya),

      nupCode: d.nupCode || d.nup || d.kodeNup || "",
      brand: d.brand || d.merk || "",
      specs: d.specs || d.spesifikasi || d.spesifikasiDetail || "",
    }));
  }, [open, initialData, category]);

  // kalau modal ditutup, jangan render apa-apa
  if (!open) return null;

  const set = (key) => (e) => {
    const val = e?.target?.value;
    setForm((p) => ({ ...p, [key]: val }));
  };

  const setNumber = (key) => (e) => {
    const v = Number(e?.target?.value || 0);
    setForm((p) => ({ ...p, [key]: v }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Nama barang wajib diisi.";
    if (!form.status) return "Status wajib dipilih.";

    if (category === "vehicle") {
      if (!form.vehiclePlate.trim()) return "Nomor plat wajib diisi (kendaraan).";
    } else {
      if (!form.nupCode.trim()) return "Kode NUP wajib diisi (barang).";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: isEdit ? form.id : makeId(),
        category: form.category || category,

        name: form.name.trim(),
        code: form.code.trim(),
        location: form.location.trim(),
        condition: form.condition.trim(),
        qty: Number(form.qty || 1),
        status: form.status,
        photoUrl: String(form.photoUrl || "").trim(),

        ...( (form.category || category) === "vehicle"
    ? {
        vehiclePlate: form.vehiclePlate.trim(),
        chassisNumber: form.chassisNumber.trim(),
        engineNumber: form.engineNumber.trim(),
        oilEngineAt: form.oilEngineAt || null,
        oilEngineNextAt: form.oilEngineNextAt || null,
        oilGearAt: form.oilGearAt || null,
        oilGearNextAt: form.oilGearNextAt || null,
        taxNextAt: form.taxNextAt || null,
      }
    : {
        nupCode: form.nupCode.trim(),
        brand: form.brand.trim(),
        specs: form.specs.trim(),
      }
         ),

    isDeleted: false,  
};

      await onSubmit?.(payload);
      onClose?.();
    } catch (ex) {
      setErr(ex?.message || "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              {title}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Isi data seperlunya, sisanya bisa menyusul.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {err ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
              {err}
            </div>
          ) : null}

          {/* Common fields */}
          <Field label="Nama Barang/Fasilitas *">
            <input
              value={form.name}
              onChange={set("name")}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
              placeholder="Contoh: Avanza Dinas / Laptop Lenovo"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Kode (opsional)">
              <input
                value={form.code}
                onChange={set("code")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                placeholder="Kode internal"
              />
            </Field>

            <Field label="Status *">
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Lokasi (opsional)">
              <input
                value={form.location}
                onChange={set("location")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                placeholder="Gudang / Ruang TU"
              />
            </Field>

            <Field label="Jumlah / Stok">
              <input
                type="number"
                min={1}
                value={form.qty}
                onChange={setNumber("qty")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
              />
            </Field>
          </div>

          <Field label="Kondisi (opsional)">
            <input
              value={form.condition}
              onChange={set("condition")}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
              placeholder="Baik / Perlu servis / Catatan kondisi"
            />
          </Field>

          <Field label="URL Foto (opsional)">
            <input
              value={form.photoUrl}
              onChange={set("photoUrl")}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
              placeholder="https://..."
            />
          </Field>

          {/* Category-specific */}
          {category === "vehicle" ? (
            <>
              <div className="pt-2">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Detail Kendaraan
                </p>
              </div>

              <Field label="Nomor Plat *">
                <input
                  value={form.vehiclePlate}
                  onChange={set("vehiclePlate")}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                  placeholder="KB 1234 XX"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nomor Rangka (opsional)">
                  <input
                    value={form.chassisNumber}
                    onChange={set("chassisNumber")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                    placeholder="..."
                  />
                </Field>
                <Field label="Nomor Mesin (opsional)">
                  <input
                    value={form.engineNumber}
                    onChange={set("engineNumber")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                    placeholder="..."
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Tgl Ganti Oli Mesin">
                  <input
                    type="date"
                    value={form.oilEngineAt}
                    onChange={set("oilEngineAt")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                  />
                </Field>
                <Field label="Tgl Ganti Oli Mesin Berikutnya">
                  <input
                    type="date"
                    value={form.oilEngineNextAt}
                    onChange={set("oilEngineNextAt")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Tgl Ganti Oli Perseneling">
                  <input
                    type="date"
                    value={form.oilGearAt}
                    onChange={set("oilGearAt")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                  />
                </Field>
                <Field label="Tgl Ganti Oli Perseneling Berikutnya">
                  <input
                    type="date"
                    value={form.oilGearNextAt}
                    onChange={set("oilGearNextAt")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                  />
                </Field>
              </div>

              <Field label="Tgl Bayar Pajak Berikutnya">
                <input
                  type="date"
                  value={form.taxNextAt}
                  onChange={set("taxNextAt")}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                />
              </Field>
            </>
          ) : (
            <>
              <div className="pt-2">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Detail Barang
                </p>
              </div>

              <Field label="Kode NUP *">
                <input
                  value={form.nupCode}
                  onChange={set("nupCode")}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                  placeholder="NUP / kode barang"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Merk (opsional)">
                  <input
                    value={form.brand}
                    onChange={set("brand")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                    placeholder="Lenovo / Epson / dll"
                  />
                </Field>
                <Field label="Spesifikasi Detail (opsional)">
                  <input
                    value={form.specs}
                    onChange={set("specs")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                    placeholder="RAM 8GB, i5, SSD 256..."
                  />
                </Field>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-100 text-gray-700 font-black text-xs uppercase tracking-widest"
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg disabled:opacity-70"
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
