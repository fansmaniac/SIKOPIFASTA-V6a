// src/hooks/useAuth.js
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { getUserByUid, upsertUserProfile } from "../services/users.service";

/**
 * useAuth()
 * - firebaseUser: user dari Firebase Auth (uid, email, displayName, dll)
 * - profile: data user dari Firestore (role, nama, nip, whatsapp, isActive, dll)
 * - isAdmin: boolean (berdasarkan profile.role)
 * - loading: true saat masih cek session / fetch profile
 * - error: jika ada error saat fetch/upsert profile
 */
export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      setError("");

      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1) Ambil profile dari Firestore
        let p = await getUserByUid(u.uid);

        // 2) Kalau belum ada (user baru), buat profile minimal
        if (!p) {
          p = await upsertUserProfile(u.uid, {
            email: u.email || "",
            nama: (u.displayName || "").toUpperCase(),
            role: "user",
            isActive: true,
          });
        } else {
          // 3) Optional: sync email/displayName kalau kosong (tanpa ganggu role admin)
          // Ini aman untuk menjaga data tetap rapi.
          const needSyncEmail = !p.email && u.email;
          const needSyncNama = !p.nama && u.displayName;

          if (needSyncEmail || needSyncNama) {
            p = await upsertUserProfile(u.uid, {
              email: needSyncEmail ? u.email : p.email,
              nama: needSyncNama ? String(u.displayName).toUpperCase() : p.nama,
            });
          }
        }

        setProfile(p);
      } catch (e) {
        setError(e?.message || "Gagal memuat profil pengguna.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const isAdmin = useMemo(() => profile?.role === "admin", [profile]);
  const isActive = useMemo(() => profile?.isActive !== false, [profile]);

  return {
    firebaseUser,
    profile,
    isAdmin,
    isActive,
    loading,
    error,
  };
}
