import React, { useState } from 'react';
import { Lock, ArrowLeft, ShieldAlert, KeyRound } from 'lucide-react';

export default function AdminLoginPage({ onLoginSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        onLoginSuccess(data.token);
      } else {
        setError(data.message || 'Password admin salah!');
      }
    } catch (err) {
      setError('Gagal menghubungi server: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Back Button */}
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Publik</span>
        </button>

        {/* Card Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-600/20 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Portal Administrator
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Kelola Item Produk, Kategori, dan Konfigurasi API Stok
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-md">
          
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  autoFocus
                  required
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Hubungi administrator utama jika Anda lupa kata sandi.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition"
              >
                {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
