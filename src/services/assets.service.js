// src/services/assets.service.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * List assets by category.
 * - category: "vehicle" | "electronics" | "others"
 * - Filter soft-deleted di client (biar tidak ribet index Firestore).
 */
export async function listAssetsByCategory(category) {
  const colRef = collection(db, "assets");

  const q = category ? query(colRef, where("category", "==", category)) : colRef;

  const snap = await getDocs(q);

  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // soft delete filter: buang yang isDeleted === true
  return rows.filter((r) => r?.isDeleted !== true);
}

/**
 * Ambil 1 asset (opsional dipakai nanti)
 */
export async function getAssetById(assetId) {
  if (!assetId) return null;
  const ref = doc(db, "assets", assetId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Upsert asset (opsional dipakai nanti untuk tambah/edit)
 * - assetId: kalau ada => update, kalau kosong => pakai payload.id atau buat id di luar
 */
export async function upsertAsset(assetId, payload = {}) {
  const id = assetId || payload.id;
  if (!id) throw new Error("ID asset wajib ada.");

  const ref = doc(db, "assets", id);

  const data = {
    ...payload,
    id,
    isDeleted: payload.isDeleted === true ? true : false,
    updatedAt: serverTimestamp(),
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
  if (!assetId) throw new Error("ID asset wajib ada.");

  const ref = doc(db, "assets", assetId);

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
