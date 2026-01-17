// src/utils/constants.js

/**
 * SIKOPIFASTA constants
 * - Categories: 3 sub-menu inventaris
 * - Status: untuk proses inventaris + peminjaman
 * - statusOrder: untuk sorting prioritas tabel (requested -> borrowed -> available -> broken/maintenance)
 */

// =====================
// Categories
// =====================
export const ASSET_CATEGORIES = [
  { key: "vehicle", label: "Kendaraan Dinas" },
  { key: "electronics", label: "Peralatan Elektronik" },
  { key: "other", label: "Barang Lainnya" },
];

export const ASSET_CATEGORY_LABEL = {
  vehicle: "Kendaraan Dinas",
  electronics: "Peralatan Elektronik",
  other: "Barang Lainnya",
};

// =====================
// Status (master)
// =====================
// catatan mapping:
// - "requested" = Dalam Antrian / Diajukan
// - "borrowed"  = Dipinjam
// - "available" = Tersedia
// - "broken"    = Rusak
// - "maintenance" = Maintenance/Perbaikan (opsional tapi berguna)
export const ASSET_STATUS = [
  { key: "available", label: "Tersedia" },
  { key: "requested", label: "Dalam Antrian" }, // atau "Diajukan"
  { key: "borrowed", label: "Dipinjam" },
  { key: "broken", label: "Rusak" },
  { key: "maintenance", label: "Perawatan" },
];

export const ASSET_STATUS_LABEL = {
  available: "Tersedia",
  requested: "Dalam Antrian",
  borrowed: "Dipinjam",
  broken: "Rusak",
  maintenance: "Perawatan",
};

// Untuk dropdown filter (UI)
export const ASSET_STATUS_FILTER_OPTIONS = [
  { key: "all", label: "Semua Status" },
  ...ASSET_STATUS.map((s) => ({ key: s.key, label: s.label })),
];

// =====================
// Sorting Priority
// =====================
// rules urutan tabel:
// 1) requested (antrian/diajukan) paling atas
// 2) borrowed (dipinjam) lalu urut by loanEndAt paling dekat
// 3) available
// 4) broken / maintenance paling bawah
export const STATUS_ORDER = {
  requested: 1,
  borrowed: 2,
  available: 3,
  // rusak & perawatan: paling bawah
  maintenance: 4,
  broken: 5,
};

// =====================
// Helpers
// =====================
export function getCategoryLabel(categoryKey) {
  return ASSET_CATEGORY_LABEL[categoryKey] || String(categoryKey || "-");
}

export function getStatusLabel(statusKey) {
  return ASSET_STATUS_LABEL[statusKey] || String(statusKey || "-");
}

export function getStatusOrder(statusKey) {
  return STATUS_ORDER[statusKey] ?? 99;
}

/**
 * Build uniqueKey untuk upsert via upload excel
 * - vehicle: PLAT:<plat>
 * - electronics/other: NUP:<nup>
 */
export function buildUniqueKey(category, { plate, nup }) {
  if (category === "vehicle") {
    const p = String(plate || "").trim().toUpperCase();
    return p ? `PLAT:${p}` : "";
  }
  const n = String(nup || "").trim().toUpperCase();
  return n ? `NUP:${n}` : "";
}

/**
 * Normalisasi string pencarian (buat searchKey)
 */
export function normalizeSearchText(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export const DEFAULTS = {
  USER_ROLE: "user",
  ADMIN_ROLE: "admin",
  IS_ACTIVE: true,
};