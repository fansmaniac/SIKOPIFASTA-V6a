// src/modules/user/Dashboard.jsx
import React from "react";
import { ClipboardList, Boxes, CalendarCheck, ArrowRight } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-white p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
            <ClipboardList size={26} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              Dashboard User
            </p>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">
              SIKOPIFASTA — Peminjaman
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Ajukan peminjaman fasilitas & lihat riwayat pinjaman.
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

      {/* Stats (placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          icon={<Boxes size={20} />}
          title="Fasilitas Tersedia"
          value="—"
          note="(nanti dari Firestore)"
        />
        <StatCard
          icon={<CalendarCheck size={20} />}
          title="Pinjaman Aktif"
          value="—"
          note="(nanti dari koleksi loans)"
        />
        <StatCard
          icon={<ClipboardList size={20} />}
          title="Riwayat Peminjaman"
          value="—"
          note="(nanti query per user)"
        />
      </div>

      {/* Categories placeholder */}
      <div className="bg-white rounded-3xl shadow-xl border border-white p-6">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Kategori
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
          <CategoryCard
            title="Kendaraan Dinas"
            desc="Ajukan pinjam kendaraan operasional"
          />
          <CategoryCard
            title="Peralatan Elektronik"
            desc="Laptop, proyektor, kamera, dll"
          />
          <CategoryCard
            title="Barang Lain"
            desc="Fasilitas umum & inventaris lainnya"
          />
        </div>
      </div>

      {/* Next step hint */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
        <p className="font-black text-emerald-700">
          (Stub) Tahap berikutnya:
        </p>
        <p className="text-sm text-emerald-700/80 mt-2 leading-relaxed">
          Setelah ini kita bikin <span className="font-bold">constants.js</span> untuk kategori + status,
          lalu bikin <span className="font-bold">assets.service.js</span> buat baca/tulis data fasilitas.
          Baru deh dashboard ini jadi “hidup”.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, note }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-white p-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-gray-700">
          {icon}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{note}</p>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ title, desc }) {
  return (
    <button
      type="button"
      className="text-left bg-slate-50 border border-slate-100 rounded-3xl p-6 hover:bg-slate-100 transition-all active:scale-[0.99]"
      onClick={() => {
        // nanti: navigate ke CategoryDetail
        // setView("category_detail") + setSelectedCategory(...)
        alert(`(Stub) Nanti masuk ke kategori: ${title}`);
      }}
    >
      <p className="font-black text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{desc}</p>

      <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700">
        Lihat daftar <ArrowRight size={16} />
      </div>
    </button>
  );
}
