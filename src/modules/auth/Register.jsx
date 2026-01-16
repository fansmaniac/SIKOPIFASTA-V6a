// src/modules/auth/Register.jsx
import React, { useMemo, useState } from "react";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  IdCard,
  ArrowLeft,
} from "lucide-react";

import { registerWithEmail } from "../../services/auth.service";
import { upsertUserProfile } from "../../services/users.service";

/**
 * Props:
 * - onGoLogin: function() => void
 */
export default function Register({ onGoLogin }) {
  const [nama, setNama] = useState("");
  const [nip, setNip] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const passTooShort = useMemo(() => String(password).length > 0 && String(password).length < 6, [password]);
  const passMismatch = useMemo(() => password2.length > 0 && password !== password2, [password, password2]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const cleanEmail = String(email || "").trim();
    const cleanNama = String(nama || "").trim();

    if (!cleanNama) {
      setError("Nama wajib diisi.");
      return;
    }
    if (!cleanEmail) {
      setError("Email wajib diisi.");
      return;
    }
    if (String(password).length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== password2) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);

    try {
      // 1) Buat akun Firebase Auth + set displayName
      const user = await registerWithEmail(cleanEmail, password, cleanNama);

      // 2) Lengkapi profile Firestore (field tambahan)
      // NOTE: role default "user" dan tidak mengganggu admin manual.
      await upsertUserProfile(user.uid, {
        email: user.email || cleanEmail,
        nama: cleanNama.toUpperCase(),
        nip: String(nip || "").trim(),
        whatsapp: String(whatsapp || "").trim(),
        role: "user",
        isActive: true,
      });

      setInfo("Pendaftaran berhasil. Silakan login / menunggu pengalihan...");
      // App.jsx + useAuth() akan menangkap session (user sudah login otomatis setelah register)
    } catch (err) {
      setError(err?.message || "Gagal mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-slate-50">
      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl max-w-md w-full border border-white animate-in zoom-in-95">
        <div className="text-center mb-10">
          <div className="bg-emerald-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white shadow-xl -rotate-3">
            <UserPlus size={40} />
          </div>

          <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2 uppercase">
            Daftar Akun
          </h2>
          <p className="text-gray-400 text-sm font-medium italic leading-relaxed">
            Buat akun baru untuk mengakses SIKOPIFASTA.
          </p>
        </div>

        {(error || info) && (
          <div
            className={`mb-6 px-5 py-4 rounded-2xl text-sm font-bold border ${
              error
                ? "bg-red-50 text-red-700 border-red-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-100"
            }`}
          >
            {error || info}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Nama */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Nama
            </label>
            <div className="relative mt-1">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="text"
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold shadow-inner"
                placeholder="Nama lengkap"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          </div>

          {/* NIP */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              NIP (opsional)
            </label>
            <div className="relative mt-1">
              <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="text"
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold shadow-inner"
                placeholder="Nomor Induk Pegawai"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              WhatsApp (opsional)
            </label>
            <div className="relative mt-1">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="text"
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold shadow-inner"
                placeholder="08xxxx / 62xxxx"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="email"
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold shadow-inner"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type={showPass ? "text" : "password"}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold shadow-inner"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-emerald-600"
                title={showPass ? "Sembunyikan password" : "Lihat password"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passTooShort && (
              <p className="text-xs font-bold text-red-500 mt-2 ml-2">
                Password minimal 6 karakter.
              </p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Konfirmasi Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type={showPass ? "text" : "password"}
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold shadow-inner"
                placeholder="Ulangi password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {passMismatch && (
              <p className="text-xs font-bold text-red-500 mt-2 ml-2">
                Konfirmasi password tidak sama.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2
              ${loading ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}
              text-white shadow-emerald-100`}
          >
            <UserPlus size={18} />
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4 border-t border-gray-50 pt-8 text-center">
          <button
            onClick={onGoLogin}
            className="flex items-center justify-center gap-2 text-gray-500 font-black text-sm uppercase tracking-widest hover:text-emerald-700 transition-colors"
            type="button"
          >
            <ArrowLeft size={16} />
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
}
