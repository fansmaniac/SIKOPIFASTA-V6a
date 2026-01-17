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
 * Upsert profil user.
 * - dipakai setelah register/login untuk memastikan ada dokumen user
 * - role default: DEFAULTS.USER_ROLE
 *   (kalau kamu set admin manual di console, dia tetap aman karena merge:true)
 */
export async function upsertUserProfile(uid, payload = {}) {
  if (!uid) throw new Error("UID wajib ada.");

  const ref = doc(db, "users", uid);

  const data = {
    uid,
    email: payload.email ? String(payload.email).trim() : null,
    displayName: payload.displayName ? String(payload.displayName).trim() : null,
    nama: payload.nama ? String(payload.nama).trim() : null,

    // ✅ pakai DEFAULTS
    role: payload.role ? String(payload.role).trim() : DEFAULTS.USER_ROLE,
    isActive: payload.isActive === false ? false : DEFAULTS.IS_ACTIVE,

    updatedAt: serverTimestamp(),
  };

  // merge:true supaya tidak menimpa field yang sudah ada
  await setDoc(ref, data, { merge: true });
  return data; // ✅ lebih enak, bisa langsung dipakai di useAuth tanpa fetch ulang
}
