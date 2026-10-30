import React, { useState } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, HardDrive, Cpu, Database } from 'lucide-react';

export default function SettingsManager({ adminToken }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleChangePassword(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok!');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password baru minimal 4 karakter!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message || 'Gagal mengubah password');
      }
    } catch (err) {
      setError('Kesalahan server: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          Pengaturan &amp; Keamanan Administrator
        </h2>
        <p className="text-xs text-slate-500">
          Ubah kredensial akses dashboard admin dan lihat informasi server
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Change Password Form */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Ganti Password Admin</h3>
              <p className="text-[11px] text-slate-500">Gunakan kombinasi yang aman</p>
            </div>
          </div>

          {message && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 4 karakter..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Perbarui Password Admin'}
            </button>
          </form>
        </div>

        {/* Server & Environment Information */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Informasi Server &amp; Lingkungan</h3>
                <p className="text-[11px] text-slate-500">Spesifikasi aplikasi katalog</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Platform Host</span>
                <span className="font-bold text-slate-800">ZimaOS / CasaOS / Local</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Database Engine</span>
                <span className="font-bold text-slate-800 font-mono">node:sqlite (catalog.db)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Server Port</span>
                <span className="font-bold text-slate-800 font-mono">3600 (HTTP)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Frontend Framework</span>
                <span className="font-bold text-slate-800">React + Vite + Tailwind CSS</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Status API Stok</span>
                <span className="font-bold text-emerald-600 inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktif Terhubung
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Aplikasi berjalan dalam mode mandiri (*standalone*) dengan konsumsi memori rendah (~30MB RAM).
          </div>
        </div>

      </div>

    </div>
  );
}
