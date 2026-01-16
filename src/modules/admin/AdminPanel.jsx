// src/modules/admin/AdminPanel.jsx
import React, { useMemo, useState } from "react";
import { LayoutDashboard, Boxes, Users, Settings } from "lucide-react";

/**
 * AdminPanel (stub)
 * Nanti kita pecah jadi:
 * - AssetsSection.jsx
 * - UsersSection.jsx
 * - SettingsSection.jsx
 */
export default function AdminPanel() {
  const [tab, setTab] = useState("assets"); // assets | users | settings

  const tabTitle = useMemo(() => {
    if (tab === "assets") return "Inventaris & Fasilitas";
    if (tab === "users") return "Manajemen Pengguna";
    return "Pengaturan";
  }, [tab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-white p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <LayoutDashboard size={26} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              Panel Admin
            </p>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">
              SIKOPIFASTA — Admin
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola inventaris, pengguna, dan pengaturan aplikasi.
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            Status
          </p>
          <p className="text-sm font-black text-emerald-600">AKTIF</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-xl border border-white p-3">
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={tab === "assets"}
            icon={<Boxes size={18} />}
            label="Inventaris"
            onClick={() => setTab("assets")}
          />
          <TabButton
            active={tab === "users"}
            icon={<Users size={18} />}
            label="Pengguna"
            onClick={() => setTab("users")}
          />
          <TabButton
            active={tab === "settings"}
            icon={<Settings size={18} />}
            label="Pengaturan"
            onClick={() => setTab("settings")}
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl shadow-xl border border-white p-6">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          {tabTitle}
        </p>

        {tab === "assets" && (
          <div className="mt-4">
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-6">
              <p className="font-black text-gray-900">
                (Stub) Area Inventaris
              </p>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Nanti di sini kita pasang komponen <span className="font-bold">AssetsSection</span>:
                list fasilitas, tambah/edit/hapus, status tersedia/dipinjam, dll.
              </p>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="mt-4">
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-6">
              <p className="font-black text-gray-900">
                (Stub) Area Manajemen Pengguna
              </p>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Nanti di sini kita pasang <span className="font-bold">UsersSection</span>:
                aktivasi akun, set role admin/user, lihat profil, dll.
              </p>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="mt-4">
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-6">
              <p className="font-black text-gray-900">
                (Stub) Area Pengaturan
              </p>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Nanti di sini kita pasang <span className="font-bold">SettingsSection</span>:
                kategori, opsi kendaraan/elektronik, integrasi WA, dll.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all
        ${active ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-gray-600 hover:bg-slate-100"}`}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}
