// src/utils/constants.js

/**
 * =========================
 * KATEGORI FASILITAS
 * =========================
 * value  → disimpan ke Firestore
 * label  → ditampilkan di UI
 */
export const CATEGORIES = [
  {
    value: "vehicle",
    label: "Kendaraan Dinas",
    description: "Mobil, motor, dan kendaraan operasional",
  },
  {
    value: "electronics",
    label: "Peralatan Elektronik",
    description: "Laptop, proyektor, kamera, printer, dll",
  },
  {
    value: "room",
    label: "Ruangan / Aula",
    description: "Ruang rapat, aula, ruang kelas",
  },
  {
    value: "equipment",
    label: "Peralatan Penunjang",
    description: "Sound system, kursi, tenda, genset",
  },
  {
    value: "other",
    label: "Fasilitas Lainnya",
    description: "Inventaris lain di luar kategori utama",
  },
];

/**
 * Helper cepat
 */
export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c])
);

/**
 * =========================
 * STATUS FASILITAS
 * =========================
 */
export const ASSET_STATUS = {
  AVAILABLE: "available", // siap dipinjam
  BORROWED: "borrowed",   // sedang dipinjam
  MAINTENANCE: "maintenance", // perbaikan
  INACTIVE: "inactive",   // tidak aktif
};

/**
 * Label untuk UI
 */
export const ASSET_STATUS_LABEL = {
  [ASSET_STATUS.AVAILABLE]: "Tersedia",
  [ASSET_STATUS.BORROWED]: "Dipinjam",
  [ASSET_STATUS.MAINTENANCE]: "Perawatan",
  [ASSET_STATUS.INACTIVE]: "Nonaktif",
};

/**
 * Warna badge (Tailwind-friendly)
 */
export const ASSET_STATUS_COLOR = {
  [ASSET_STATUS.AVAILABLE]: "emerald",
  [ASSET_STATUS.BORROWED]: "amber",
  [ASSET_STATUS.MAINTENANCE]: "sky",
  [ASSET_STATUS.INACTIVE]: "slate",
};

/**
 * =========================
 * STATUS PINJAMAN
 * =========================
 */
export const LOAN_STATUS = {
  REQUESTED: "requested", // diajukan user
  APPROVED: "approved",   // disetujui admin
  REJECTED: "rejected",   // ditolak admin
  BORROWED: "borrowed",   // sedang dipakai
  RETURNED: "returned",   // sudah dikembalikan
  LATE: "late",           // terlambat
};

export const LOAN_STATUS_LABEL = {
  [LOAN_STATUS.REQUESTED]: "Diajukan",
  [LOAN_STATUS.APPROVED]: "Disetujui",
  [LOAN_STATUS.REJECTED]: "Ditolak",
  [LOAN_STATUS.BORROWED]: "Dipinjam",
  [LOAN_STATUS.RETURNED]: "Dikembalikan",
  [LOAN_STATUS.LATE]: "Terlambat",
};

/**
 * =========================
 * ROLE USER
 * =========================
 */
export const USER_ROLE = {
  ADMIN: "admin",
  USER: "user",
};

/**
 * =========================
 * DEFAULT VALUES
 * =========================
 */
export const DEFAULTS = {
  ASSET_STATUS: ASSET_STATUS.AVAILABLE,
  USER_ROLE: USER_ROLE.USER,
  IS_ACTIVE: true,
};

/**
 * =========================
 * UTIL FUNCTIONS
 * =========================
 */

/**
 * Ambil label kategori dari value
 */
export function getCategoryLabel(value) {
  return CATEGORY_MAP[value]?.label || value;
}

/**
 * Ambil label status aset
 */
export function getAssetStatusLabel(status) {
  return ASSET_STATUS_LABEL[status] || status;
}

/**
 * Ambil warna badge status aset
 */
export function getAssetStatusColor(status) {
  return ASSET_STATUS_COLOR[status] || "slate";
}

/**
 * Ambil label status pinjaman
 */
export function getLoanStatusLabel(status) {
  return LOAN_STATUS_LABEL[status] || status;
}
