// src/services/users.service.js
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  collection,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Struktur koleksi (rapi & scalable):
 * users/{uid}
 *
 * Contoh doc:
 * {
 *   uid,
 *   email,
 *   nama,
 *   nip,
 *   whatsapp,
 *   role: "admin" | "user",
 *   isActive: true,
 *   createdAt, updatedAt
 * }
 */

const USERS_COL = "users";

function cleanString(v) {
  return String(v ?? "").trim();
}

function upper(v) {
  return cleanString(v).toUpperCase();
}

function normalizeWhatsApp(v) {
  const s = cleanString(v);
  // biar simpel dulu: angka saja. (Validasi ketat nanti di utils/validators.js)
  return s.replace(/[^\d]/g, "");
}

function friendlyDbError(err) {
  return err?.message || "Terjadi kesalahan saat memproses data pengguna.";
}

/**
 * Ambil profile user dari Firestore pakai uid (document id = uid).
 */
export async function getUserByUid(uid) {
  try {
    const ref = doc(db, USERS_COL, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    throw new Error(friendlyDbError(err));
  }
}

/**
 * Buat / update profile user saat pertama login/register.
 * - aman dipanggil berkali-kali
 * - tidak menghapus field lama (merge)
 */
export async function upsertUserProfile(uid, payload) {
  try {
    if (!uid) throw new Error("UID kosong.");

    const ref = doc(db, USERS_COL, uid);

    const base = {
      uid,
      email: cleanString(payload?.email),
      nama: upper(payload?.nama),
      nip: cleanString(payload?.nip),
      whatsapp: normalizeWhatsApp(payload?.whatsapp),
      role: payload?.role ? cleanString(payload.role) : "user",
      isActive: payload?.isActive ?? true,
      updatedAt: serverTimestamp(),
    };

    // createdAt hanya kalau doc belum ada
    const snap = await getDoc(ref);
    const data = snap.exists()
      ? base
      : { ...base, createdAt: serverTimestamp() };

    await setDoc(ref, data, { merge: true });

    // return data terbaru (ambil ulang biar konsisten)
    const after = await getDoc(ref);
    return after.exists() ? { id: after.id, ...after.data() } : null;
  } catch (err) {
    throw new Error(friendlyDbError(err));
  }
}

/**
 * Update sebagian field profile.
 * Cocok untuk edit profil user.
 */
export async function updateUserProfile(uid, patch) {
  try {
    if (!uid) throw new Error("UID kosong.");
    const ref = doc(db, USERS_COL, uid);

    const data = {
      ...(patch?.nama !== undefined ? { nama: upper(patch.nama) } : {}),
      ...(patch?.nip !== undefined ? { nip: cleanString(patch.nip) } : {}),
      ...(patch?.whatsapp !== undefined
        ? { whatsapp: normalizeWhatsApp(patch.whatsapp) }
        : {}),
      ...(patch?.email !== undefined ? { email: cleanString(patch.email) } : {}),
      ...(patch?.isActive !== undefined ? { isActive: !!patch.isActive } : {}),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(ref, data);

    const after = await getDoc(ref);
    return after.exists() ? { id: after.id, ...after.data() } : null;
  } catch (err) {
    throw new Error(friendlyDbError(err));
  }
}

/**
 * Untuk opsi kamu: Admin dibuat manual via Firebase Console:
 * - Buat akun admin di Auth
 * - Buat doc users/{uid} lalu set role="admin"
 *
 * Helper cek role admin.
 */
export async function isAdmin(uid) {
  const u = await getUserByUid(uid);
  return u?.role === "admin";
}

/**
 * Cari user by email (opsional).
 * Berguna kalau suatu saat kamu butuh mapping email->uid.
 */
export async function getUserByEmail(email) {
  try {
    const q = query(
      collection(db, USERS_COL),
      where("email", "==", cleanString(email).toLowerCase()),
      limit(1)
    );

    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (err) {
    throw new Error(friendlyDbError(err));
  }
}
