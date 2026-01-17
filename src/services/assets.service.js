// src/services/assets.service.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { ASSET_CATEGORIES, ASSET_STATUS } from "../utils/constants";

/**
 * Koleksi Firestore
 */
const COL = "assets";

/**
 * Normalisasi string untuk pencarian sederhana (lowercase + trim)
 */
function norm(v) {
  return String(v || "").trim().toLowerCase();
}

/**
 * Buat keyword sederhana untuk search (nama, kode, plat, nup, merk)
 * Dipakai untuk filter client-side atau query tambahan.
 */
function buildSearchKeywords(asset) {
  const parts = [
    asset?.kode,
    asset?.nama,
    asset?.kategori,
    asset?.lokasi,
    asset?.platNomor,
    asset?.nup,
    asset?.merk,
  ]
    .map(norm)
    .filter(Boolean);

  // split per kata biar search "honda crv" masih kena
  const tokens = parts.flatMap((p) => p.split(/\s+/g)).filter(Boolean);

  // unique
  return Array.from(new Set(tokens)).slice(0, 50);
}

/**
 * Validate kategori & status (biar konsisten)
 */
function validateCategory(kategori) {
  const ok = Object.values(ASSET_CATEGORIES).includes(kategori);
  if (!ok) throw new Error("Kategori aset tidak valid.");
}
function validateStatus(status) {
  const ok = Object.values(ASSET_STATUS).includes(status);
  if (!ok) throw new Error("Status aset tidak valid.");
}

/**
 * Bentuk data standar sesuai kategori.
 * - Kendaraan: pakai platNomor sebagai unique key utama
 * - Elektronik / Lainnya: pakai nup sebagai unique key utama
 *
 * Catatan: kita simpan juga field "uniqueKey" untuk upsert by Plat/NUP.
 */
function shapeAssetPayload(payload) {
  const kategori = payload?.kategori;
  validateCategory(kategori);

  const status = payload?.status || ASSET_STATUS.TERSEDIA;
  validateStatus(status);

  const base = {
    kategori,
    kode: String(payload?.kode || "").trim(),
    nama: String(payload?.nama || "").trim(),
    lokasi: String(payload?.lokasi || "").trim(),
    kondisi: String(payload?.kondisi || "").trim(), // mis: "Baik", "Perlu servis"
    jumlah: Number(payload?.jumlah ?? 1) || 1,
    status, // tersedia | dipinjam | diajukan | rusak (sesuai konstanta)
    isDeleted: false,

    // meta
    updatedAt: serverTimestamp(),
  };

  // Field spesifik kategori
  if (kategori === ASSET_CATEGORIES.KENDARAAN_DINAS) {
    const platNomor = String(payload?.platNomor || "").trim().toUpperCase();
    if (!platNomor) throw new Error("Plat nomor wajib diisi untuk kendaraan dinas.");

    return {
      ...base,
      platNomor,
      nomorRangka: String(payload?.nomorRangka || "").trim(),
      nomorMesin: String(payload?.nomorMesin || "").trim(),

      tglGantiOliMesin: payload?.tglGantiOliMesin || null,
      tglGantiOliMesinBerikutnya: payload?.tglGantiOliMesinBerikutnya || null,
      tglGantiOliPerseneling: payload?.tglGantiOliPerseneling || null,
      tglGantiOliPersenelingBerikutnya: payload?.tglGantiOliPersenelingBerikutnya || null,
      tglBayarPajakBerikutnya: payload?.tglBayarPajakBerikutnya || null,

      // key untuk upsert
      uniqueKey: `plat:${platNomor}`,
      searchKeywords: buildSearchKeywords({ ...base, platNomor }),
    };
  }

  // Elektronik / Barang Lainnya
  const nup = String(payload?.nup || "").trim().toUpperCase();
  if (!nup) throw new Error("NUP wajib diisi untuk kategori ini.");

  return {
    ...base,
    nup,
    merk: String(payload?.merk || "").trim(),
    spesifikasi: String(payload?.spesifikasi || "").trim(),

    uniqueKey: `nup:${nup}`,
    searchKeywords: buildSearchKeywords({ ...base, nup }),
  };
}

/**
 * Get asset by id
 */
export async function getAssetById(id) {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * List assets (default: tidak termasuk yang dihapus)
 * Filter opsional:
 * - kategori
 * - status
 *
 * Catatan: untuk sorting kompleks (diajukan dulu, dipinjam by tgl kembali, dst)
 * kita lakukan di UI/hook karena butuh gabung data loan juga.
 */
export async function listAssets({ kategori, status, max = 500 } = {}) {
  const colRef = collection(db, COL);
  const clauses = [where("isDeleted", "==", false)];

  if (kategori) clauses.push(where("kategori", "==", kategori));
  if (status) clauses.push(where("status", "==", status));

  // OrderBy minimal biar stabil (Firestore butuh index untuk kombinasi tertentu)
  const q = query(colRef, ...clauses, orderBy("nama"), limit(max));

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Cari asset by uniqueKey (plat atau nup)
 * Dipakai untuk fitur "upload excel" (upsert).
 */
export async function getAssetByUniqueKey(uniqueKey) {
  const colRef = collection(db, COL);
  const q = query(
    colRef,
    where("uniqueKey", "==", String(uniqueKey || "").trim()),
    limit(1)
  );
  const snap = await getDocs(q);
  const doc0 = snap.docs[0];
  if (!doc0) return null;
  return { id: doc0.id, ...doc0.data() };
}

/**
 * Create asset (manual tambah via form)
 */
export async function createAsset(payload, { createdByUid } = {}) {
  const data = shapeAssetPayload(payload);

  const colRef = collection(db, COL);

  // OPTIONAL: cegah duplikasi plat/nup (kalau ada yang sama → lempar error)
  const existing = await getAssetByUniqueKey(data.uniqueKey);
  if (existing && existing.isDeleted !== true) {
    throw new Error("Data sudah ada (Plat/NUP sudah terdaftar). Gunakan edit / upload untuk update.");
  }

  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    createdByUid: createdByUid || null,
  });

  return await getAssetById(docRef.id);
}

/**
 * Update asset by id
 * - Tidak mengubah createdAt/createdByUid
 * - Re-shape payload agar konsisten, tapi tetap mempertahankan field yang tidak dikirim (patch).
 */
export async function updateAsset(id, patch) {
  if (!id) throw new Error("ID aset wajib.");

  const current = await getAssetById(id);
  if (!current) throw new Error("Aset tidak ditemukan.");

  // merge dulu, lalu shape supaya konsisten
  const merged = { ...current, ...patch };
  const shaped = shapeAssetPayload(merged);

  // kalau uniqueKey berubah (misal plat diganti), cek duplikasi
  if (shaped.uniqueKey !== current.uniqueKey) {
    const existing = await getAssetByUniqueKey(shaped.uniqueKey);
    if (existing && existing.id !== id && existing.isDeleted !== true) {
      throw new Error("Plat/NUP tersebut sudah dipakai aset lain.");
    }
  }

  const ref = doc(db, COL, id);
  await updateDoc(ref, shaped);

  return await getAssetById(id);
}

/**
 * Soft delete asset (sesuai konsep kamu: bisa restore nanti)
 */
export async function softDeleteAsset(id, { deletedByUid } = {}) {
  if (!id) throw new Error("ID aset wajib.");

  const ref = doc(db, COL, id);
  await updateDoc(ref, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedByUid: deletedByUid || null,
    updatedAt: serverTimestamp(),
  });

  return true;
}

/**
 * Restore asset (kalau nanti dibutuhkan)
 */
export async function restoreAsset(id) {
  if (!id) throw new Error("ID aset wajib.");

  const ref = doc(db, COL, id);
  await updateDoc(ref, {
    isDeleted: false,
    deletedAt: null,
    deletedByUid: null,
    updatedAt: serverTimestamp(),
  });

  return true;
}

/**
 * Upsert asset by uniqueKey (dipakai untuk import Excel)
 * - Jika ada: update
 * - Jika tidak ada: create (pakai setDoc dengan doc id baru)
 */
export async function upsertAssetByUniqueKey(payload, { actorUid } = {}) {
  const data = shapeAssetPayload(payload);

  const existing = await getAssetByUniqueKey(data.uniqueKey);

  if (existing) {
    // update existing
    return await updateAsset(existing.id, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedByUid: actorUid || null,
      // jangan paksa isDeleted=true tetap, kita restore kalau ternyata upload ulang
      isDeleted: false,
      deletedAt: null,
      deletedByUid: null,
    });
  }

  // create new with deterministic doc id (optional) → biar rapi, pakai uniqueKey
  // Tapi Firestore doc id tidak boleh ada ":" ? sebenarnya boleh, tapi lebih aman ganti ke "_"
  const safeId = data.uniqueKey.replace(/[:\s]/g, "_");
  const ref = doc(db, COL, safeId);

  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    createdByUid: actorUid || null,
  });

  return await getAssetById(ref.id);
}
