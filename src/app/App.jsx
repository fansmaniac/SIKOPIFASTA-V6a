// src/app/App.jsx
import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { logout } from "../services/auth.service";

// Modules
import Login from "../modules/auth/Login";
import Register from "../modules/auth/Register";

// (Nanti kita bikin file-file ini. Untuk sementara, kamu bisa buat stub sederhana dulu.)
import AdminPanel from "../modules/admin/AdminPanel";
import Dashboard from "../modules/user/Dashboard";

// Optional components (kalau sudah ada)
// import Header from "../components/Header";
// import Footer from "../components/Footer";

export default function App() {
  const { firebaseUser, profile, isAdmin, isActive, loading, error } = useAuth();

  // view untuk saat belum login
  const [authView, setAuthView] = useState("login"); // "login" | "register"

  // Kalau user sudah login, paksa balik ke login screen tidak relevan lagi.
  useEffect(() => {
    if (firebaseUser) setAuthView("login");
  }, [firebaseUser]);

  const displayName = useMemo(() => {
    return (
      profile?.nama ||
      firebaseUser?.displayName ||
      firebaseUser?.email ||
      "Pengguna"
    );
  }, [profile, firebaseUser]);

  const handleLogout = async () => {
    await logout();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white px-8 py-6 rounded-3xl shadow-xl border border-white">
          <p className="font-black text-gray-800 uppercase tracking-widest text-sm">
            Memuat sesi...
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Sabar ya sob, ini bukan buffering sinetron 😄
          </p>
        </div>
      </div>
    );
  }

  // Auth error (misalnya Firestore permission / rules)
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white max-w-lg w-full px-8 py-7 rounded-3xl shadow-xl border border-white">
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-widest">
            Terjadi Masalah
          </h1>
          <p className="text-red-600 font-bold mt-3">{error}</p>
          <p className="text-gray-500 mt-3 text-sm leading-relaxed">
            Biasanya ini karena rules Firestore belum disetel atau koleksi{" "}
            <span className="font-bold">users</span> belum bisa dibaca setelah
            login.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-xs"
            >
              Reload
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-3 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Jika belum login → tampilkan auth screens
  if (!firebaseUser) {
    return authView === "register" ? (
      <Register onGoLogin={() => setAuthView("login")} />
    ) : (
      <Login onGoRegister={() => setAuthView("register")} />
    );
  }

  // Sudah login tapi profile belum ada (should jarang terjadi karena useAuth auto-upsert)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white max-w-lg w-full px-8 py-7 rounded-3xl shadow-xl border border-white">
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-widest">
            Menyiapkan Profil
          </h1>
          <p className="text-gray-500 mt-3 text-sm">
            Profil pengguna belum tersedia. Coba reload ya.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-xs"
            >
              Reload
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-3 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User nonaktif (opsional)
  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white max-w-lg w-full px-8 py-7 rounded-3xl shadow-xl border border-white">
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-widest">
            Akun Nonaktif
          </h1>
          <p className="text-gray-600 mt-3">
            Halo, <span className="font-black">{displayName}</span>. Akun kamu
            saat ini <span className="font-black text-red-600">nonaktif</span>.
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            Hubungi admin untuk mengaktifkan akun.
          </p>

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full px-5 py-3 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in main area
  // Kamu bisa bungkus pakai Header/Footer kalau sudah dibuat.
  return (
    <div className="min-h-screen bg-slate-50">
      {/* <Header /> */}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Greeting bar kecil */}
        <div className="bg-white rounded-3xl shadow-xl border border-white p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              SIKOPIFASTA
            </p>
            <p className="text-lg font-black text-gray-900">
              Halo, {displayName}
            </p>
            <p className="text-sm text-gray-500">
              Role:{" "}
              <span className="font-bold">
                {isAdmin ? "ADMIN" : "USER"}
              </span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-xs"
          >
            Logout
          </button>
        </div>

        <div className="mt-6">
          {isAdmin ? <AdminPanel /> : <Dashboard />}
        </div>
      </div>

      {/* <Footer /> */}
    </div>
  );
}
