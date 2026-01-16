// src/services/assets.service.js
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../config/firebase";
import {
  ASSET_STATUS,
  DEFAULTS,
} from "../utils/constants";

const COL = "assets";

/**
 * =========================
 * CREATE
 * =========================
 */

/**
 * Tambah fasilitas / inventaris baru (ADMIN)
 */
export async function createAsset(payload) {
  const data = {
    name: String(payload.name || "").trim(),
    category: payload.category,
    description: String(payload.description || "").trim(),
    status: payload.status || DEFAULTS.ASSET_STATUS,
    location: String(payload.location || "").trim(),
    code: String(payload.code || "").trim(), // kode inventaris (opsional)
    isActive: payload.isActive !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COL), data);
  return { id: ref.id, ...data };
}

/**
 * =========================
 * READ
 * =========================
 */

/**
 * Ambil 1 asset by ID
 */
export async function getAssetById(id) {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Ambil semua asset (ADMIN)
 */
export async function getAllAssets() {
  const q = query(
    collection(db, COL),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Ambil asset aktif & tersedia (USER)
 */
export async function getAvailableAssets() {
  const q = query(
    collection(db, COL),
    where("isActive", "==", true),
    where("status", "==", ASSET_STATUS.AVAILABLE),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Ambil asset berdasarkan kategori (USER)
 */
export async function getAssetsByCategory(category) {
  const q = query(
    collection(db, COL),
    where("isActive", "==", true),
    where("category", "==", category),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * =========================
 * UPDATE
 * =========================
 */

/**
 * Update data asset (ADMIN)
 */
export async function updateAsset(id, payload) {
  const ref = doc(db, COL, id);

  const data = {
    ...payload,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(ref, data);
  return true;
}

/**
 * Update status asset (dipakai saat approve / return)
 */
export async function updateAssetStatus(id, status) {
  const ref = doc(db, COL, id);

  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });

  return true;
}

/**
 * =========================
 * DELETE (SOFT)
 * =========================
 */

/**
 * Nonaktifkan asset (soft delete)
 */
export async function deactivateAsset(id) {
  const ref = doc(db, COL, id);

  await updateDoc(ref, {
    isActive: false,
    status: ASSET_STATUS.INACTIVE,
    updatedAt: serverTimestamp(),
  });

  return true;
}

/**
 * Aktifkan kembali asset
 */
export async function activateAsset(id) {
  const ref = doc(db, COL, id);

  await updateDoc(ref, {
    isActive: true,
    status: ASSET_STATUS.AVAILABLE,
    updatedAt: serverTimestamp(),
  });

  return true;
}
