// src/services/auth.service.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "../config/firebase";
import { upsertUserProfile, getUserProfileByUid } from "./users.service";

/**
 * Biar error Firebase kebaca manusia.
 */
function friendlyAuthError(err) {
  const code = err?.code || "";

  const map = {
    "auth/invalid-email": "Format email tidak valid.",
    "auth/missing-email": "Email wajib diisi.",
    "auth/missing-password": "Password wajib diisi.",
    "auth/weak-password": "Password terlalu lemah (minimal 6 karakter).",
    "auth/user-not-found": "Akun tidak ditemukan. Cek email atau daftar dulu.",
    "auth/wrong-password": "Password salah. Coba lagi.",
    "auth/invalid-credential": "Email atau password salah.",
    "auth/email-already-in-use": "Email sudah terdaftar. Silakan login.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat.",
    "auth/network-request-failed": "Jaringan bermasalah. Cek koneksi internet.",
    "auth/operation-not-allowed":
      "Login Email/Password belum diaktifkan di Firebase Console.",
  };

  return map[code] || err?.message || "Terjadi kesalahan saat autentikasi.";
}

/**
 * Login pakai email & password.
 * Setelah login sukses, pastikan profil user ada di Firestore (auto-upsert).
 */
export async function loginWithEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      String(email || "").trim(),
      String(password || "")
    );

    const user = cred.user;

    // Auto-upsert profile minimal (tidak mengubah role)
    await upsertUserProfile(user.uid, {
      uid: user.uid,
      email: user.email,
      nama: (user.displayName || "").toUpperCase(),
      role: "user", // default; kalau sudah admin di Firestore, fungsi upsert harus menjaga role lama
      updatedAt: new Date().toISOString(),
    });

    return user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/**
 * Register akun baru di Firebase Auth.
 * Setelah register: set displayName (opsional) + buat profile Firestore.
 */
export async function registerWithEmail(email, password, displayName) {
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      String(email || "").trim(),
      String(password || "")
    );

    const user = cred.user;

    // Set displayName di Auth profile (buat UI saja)
    if (displayName) {
      await updateProfile(user, { displayName: String(displayName).trim() });
    }

    // Buat profile Firestore
    await upsertUserProfile(user.uid, {
      uid: user.uid,
      email: user.email,
      nama: String(displayName || user.displayName || "").toUpperCase(),
      role: "user", // default user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/**
 * Logout.
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/**
 * Reset password via email.
 */
export async function sendResetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, String(email || "").trim());
    return true;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

/**
 * Util: ambil user yang sedang login (kalau ada).
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Util opsional: ambil profile Firestore untuk user yang sedang login.
 * (berguna untuk cek role admin/user setelah login)
 */
export async function getMyProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  return await getUserProfileByUid(user.uid);
}
