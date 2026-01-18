// src/services/users.service.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { DEFAULTS } from "../utils/constants";

/**
 * Ambil profil user dari Firestore berdasarkan uid.
 * Path: users/{uid}
 */
export async function getUserProfileByUid(uid) {
  if (!uid) return null;

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() };
}

/**
 * Upsert profil user (AMAN: tidak menimpa role admin).
 * - Dipakai setelah register/login untuk memastikan ada dokumen user.
 * - Role hanya di-set saat user BARU dibuat.
 */
export async function upsertUserProfile(uid, payload = {}) {
  if (!uid) throw new Error("UID wajib ada.");

  const ref = doc(db, "users", uid);

  // cek apakah user sudah ada
  const snap = await getDoc(ref);
  const isNew = !snap.exists();
  const existing = snap.exists() ? snap.data() : null;

  const data = {
    uid,

    // kalau payload kosong, jangan null-kan data lama
    email: payload.email ? String(payload.email).trim() : (existing?.email ?? null),
    displayName: payload.displayName
      ? String(payload.displayName).trim()
      : (existing?.displayName ?? null),
    nama: payload.nama ? String(payload.nama).trim() : (existing?.nama ?? null),

    // ✅ isActive boleh diupdate, tapi default dipakai saat baru
    isActive:
      typeof payload.isActive === "boolean"
        ? payload.isActive
        : (existing?.isActive ?? DEFAULTS.IS_ACTIVE),

    updatedAt: serverTimestamp(),
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
  };

  // ✅ role cuma untuk user baru
  if (isNew) {
    data.role = DEFAULTS.USER_ROLE; // misalnya "user"
  }

  // merge:true supaya update sebagian field saja
  await setDoc(ref, data, { merge: true });

  // return object terbaru (role diambil dari existing kalau bukan new)
  return {
    uid,
    ...(existing || {}),
    ...data,
    role: isNew ? data.role : (existing?.role ?? DEFAULTS.USER_ROLE),
  };
}
