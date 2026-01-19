// src/modules/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, LogIn, KeyRound } from "lucide-react";
import { loginWithEmail, sendResetPassword } from "../../services/auth.service";

/**
 * Props (opsional):
 * - onGoRegister: function() => void  (kalau tidak dikirim, akan navigate ke /register)
 */
export default function Login({ onGoRegister }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const goRegister = () => {
    if (typeof onGoRegister === "function") return onGoRegister();
    navigate("/register");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      // sukses -> App.jsx akan mendeteksi session via useAuth() dan mengarahkan sesuai role
      setInfo("Login berhasil. Mengalihkan...");
    } catch (err) {
      setError(err?.message || "Gagal login.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError("");
    setInfo("");

    const cleanEmail = String(email || "").trim();
    if (!cleanEmail) {
      setError("Isi email dulu untuk reset password.");
      return;
    }

    setResetLoading(true);
    try {
      await sendResetPassword(cleanEmail);
      setInfo("Link reset password sudah dikirim ke email kamu. Cek inbox/spam.");
    } catch (err) {
      setError(err?.message || "Gagal mengirim reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-slate-50">
      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl max-w-md w-full border border-white animate-in zoom-in-95">
        <div className="text-center mb-10">
          <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white shadow-xl rotate-3">
            <ShieldCheck size={40} />
          </div>

          <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2 uppercase">
            Portal Masuk
          </h2>
          <p className="text-gray-400 text-sm font-medium italic leading-relaxed">
            Login menggunakan email dan password yang terdaftar.
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
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="email"
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold shadow-inner"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type={showPass ? "text" : "password"}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-indigo-600"
                title={showPass ? "Sembunyikan password" : "Lihat password"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2
              ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}
              text-white shadow-indigo-100`}
          >
            <LogIn size={18} />
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4 border-t border-gray-50 pt-8 text-center">
          <button
            onClick={goRegister}
            className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:text-indigo-800 transition-colors"
            type="button"
          >
            Belum punya akun? Daftar
          </button>

          <button
            onClick={handleReset}
            disabled={resetLoading}
            className={`flex items-center justify-center gap-2 font-bold text-sm transition-colors uppercase tracking-widest
              ${resetLoading ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-red-500"}`}
            type="button"
          >
            <KeyRound size={16} />
            {resetLoading ? "Mengirim..." : "Lupa Password?"}
          </button>
        </div>
      </div>
    </div>
  );
}
