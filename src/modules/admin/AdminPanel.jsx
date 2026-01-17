// src/modules/admin/AdminPanel.jsx
import React, { useMemo, useState } from "react";
import { LayoutDashboard, Boxes, Users, Settings, LogOut } from "lucide-react";
import AssetsSection from "./AssetsSection";
import { logout } from "../../services/auth.service";


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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xl border border-white p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shrink-0">
                  <LayoutDashboard size={24} className="sm:hidden" />
                  <LayoutDashboard size={26} className="hidden sm:block" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Panel Admin
                  </p>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                    SIKOPIFASTA — Admin
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Kelola inventaris, pengguna, dan pengaturan aplikasi.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="sm:text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    Status
                  </p>
                  <p className="text-sm font-black text-emerald-600">AKTIF</p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="px-4 py-3 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2"
                title="Logout"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-3xl shadow-xl border border-white p-2 sm:p-3">
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
          <div className="bg-white rounded-3xl shadow-xl border border-white p-4 sm:p-6">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              {tabTitle}
            </p>

            {tab === "assets" && <AssetsSection />}

            {tab === "users" && (
              <div className="mt-4">
                <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4 sm:p-6">
                  <p className="font-black text-gray-900">
                    (Stub) Area Manajemen Pengguna
                  </p>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    Nanti di sini kita pasang{" "}
                    <span className="font-bold">UsersSection</span>: aktivasi akun, set
                    role admin/user, lihat profil, dll.
                  </p>
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div className="mt-4">
                <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4 sm:p-6">
                  <p className="font-black text-gray-900">(Stub) Area Pengaturan</p>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    Nanti di sini kita pasang{" "}
                    <span className="font-bold">SettingsSection</span>: kategori, opsi
                    kendaraan/elektronik, integrasi WA, dll.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full sm:w-auto px-4 sm:px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center sm:justify-start gap-2 transition-all
        ${active ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-gray-600 hover:bg-slate-100"}`}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}
