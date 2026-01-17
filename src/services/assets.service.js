// src/services/assets.service.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Urutan prioritas status untuk sorting di admin table
 * (requested paling atas, broken paling bawah)
 */
const STATUS_ORDER = {
  requested: 0,
  borrowed: 1,
  available: 2,
  maintenance: 3,
  broken: 4,
};

function normalizeString(v) {
  return String(v ?? "").trim();
}

function normalizeNumber(v, fallback = 1) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeStatus(v) {
  const s = normalizeString(v);
  return s || "available";
}

function normalizeCategory(v) {
  const c = normalizeString(v);
  // batasi ke 3 kategori valid
  if (c === "vehicle" || c === "electronics" || c === "others") return c;
  return "";
}

function getStatusOrder(status) {
  return STATUS_ORDER[status] ?? 99;
}

function toMillisMaybe(v) {
  // mendukung string "YYYY-MM-DD" atau Date
  if (!v) return null;
  const d = new Date(v);
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

function normalizeAssetPayload(payload = {}) {
  const category = normalizeCategory(payload.category);
  if (!category) throw new Error("Category wajib ada (vehicle/electronics/others).");

  const base = {
    id: normalizeString(payload.id),
    category,
    name: normalizeString(payload.name),
    code: normalizeString(payload.code),
    location: normalizeString(payload.location),
    condition: normalizeString(payload.condition),
    qty: normalizeNumber(payload.qty, 1),
    status: normalizeStatus(payload.status),
    photoUrl: normalizeString(payload.photoUrl),
    isDeleted: payload.isDeleted === true,
  };

  if (!base.id) throw new Error("ID asset wajib ada.");
  if (!base.name) throw new Error("Nama barang wajib diisi.");

  // category-specific
  if (category === "vehicle") {
    const vehiclePlate = normalizeString(payload.vehiclePlate);
    if (!vehiclePlate) throw new Error("Nomor plat wajib diisi (kendaraan).");

    return {
      ...base,
      vehiclePlate,
      chassisNumber: normalizeString(payload.chassisNumber),
      engineNumber: normalizeString(payload.engineNumber),

      oilEngineAt: payload.oilEngineAt || null,
      oilEngineNextAt: payload.oilEngineNextAt || null,
      oilGearAt: payload.oilGearAt || null,
      oilGearNextAt: payload.oilGearNextAt || null,
      taxNextAt: payload.taxNextAt || null,
    };
  }

  // electronics / others
  const nupCode = normalizeString(payload.nupCode);
  if (!nupCode) throw new Error("Kode NUP wajib diisi (barang).");

  return {
    ...base,
    nupCode,
    brand: normalizeString(payload.brand),
    specs: normalizeString(payload.specs),
  };
}

/**
 * List assets by category.
 * - category: "vehicle" | "electronics" | "others"
 * - Filter soft-deleted di client (biar tidak ribet index Firestore)
 * - Sort prioritas:
 *   requested -> borrowed (tgl kembali terdekat) -> available -> maintenance -> broken
 */
export async function listAssetsByCategory(category) {
  const colRef = collection(db, "assets");

  const cat = normalizeCategory(category);
  const q = cat ? query(colRef, where("category", "==", cat)) : colRef;

  const snap = await getDocs(q);

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => r?.isDeleted !== true);

  // sorting prioritas
  rows.sort((a, b) => {
    const sa = normalizeStatus(a?.status);
    const sb = normalizeStatus(b?.status);

    const oa = getStatusOrder(sa);
    const ob = getStatusOrder(sb);
    if (oa !== ob) return oa - ob;

    // kalau borrowed, urut tgl kembali paling dekat
    if (sa === "borrowed" && sb === "borrowed") {
      const da = toMillisMaybe(a?.loanEndAt || a?.tglKembali) ?? Number.POSITIVE_INFINITY;
      const dbb = toMillisMaybe(b?.loanEndAt || b?.tglKembali) ?? Number.POSITIVE_INFINITY;
      return da - dbb;
    }

    // fallback: urut nama
    const na = normalizeString(a?.name || a?.nama).toLowerCase();
    const nb = normalizeString(b?.name || b?.nama).toLowerCase();
    return na.localeCompare(nb);
  });

  return rows;
}

/**
 * Ambil 1 asset (opsional dipakai nanti)
 */
export async function getAssetById(assetId) {
  const id = normalizeString(assetId);
  if (!id) return null;

  const ref = doc(db, "assets", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Upsert asset (Tambah/Edit)
 * Dipakai oleh AssetFormModal.
 *
 * Wajib ada:
 * - payload.id
 * - payload.category
 * - payload.name
 * - kendaraan: vehiclePlate wajib
 * - selain kendaraan: nupCode wajib
 *
 * Catatan:
 * - createdAt hanya di-set saat pertama kali dibuat
 * - updatedAt selalu update
 */
export async function upsertAsset(payload = {}) {
  const cleaned = normalizeAssetPayload(payload);

  const ref = doc(db, "assets", cleaned.id);

  // cek apakah dokumen sudah ada untuk menentukan createdAt
  const snap = await getDoc(ref);
  const isNew = !snap.exists();

  const data = {
    ...cleaned,
    updatedAt: serverTimestamp(),
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
  };

  // merge true: update sebagian field saja
  await setDoc(ref, data, { merge: true });
  return true;
}

/**
 * Soft delete asset:
 * - bukan hapus beneran, tapi tandai isDeleted=true
 */
export async function softDeleteAsset(assetId) {
  const id = normalizeString(assetId);
  if (!id) throw new Error("ID asset wajib ada.");

  const ref = doc(db, "assets", id);

  await setDoc(
    ref,
    {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return true;
}

/**
 * Restore asset (undo soft delete)
 * (nanti kepakai saat recycle bin dibuat)
 */
export async function restoreAsset(assetId) {
  const id = normalizeString(assetId);
  if (!id) throw new Error("ID asset wajib ada.");

  const ref = doc(db, "assets", id);

  await setDoc(
    ref,
    {
      isDeleted: false,
      deletedAt: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return true;
}

/**
 * Hard delete (OPSIONAL — biasanya jangan dulu dipakai)
 * kalau kamu benar-benar mau hapus permanen dari Firestore.
 */
export async function hardDeleteAsset(assetId) {
  const id = normalizeString(assetId);
  if (!id) throw new Error("ID asset wajib ada.");

  await deleteDoc(doc(db, "assets", id));
  return true;
}
