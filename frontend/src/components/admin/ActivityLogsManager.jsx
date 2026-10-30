import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, RefreshCw, Trash2, Shield, User, Key, Package, Globe, LogIn, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function ActivityLogsManager({ adminToken }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [confirmClear, setConfirmClear] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (selectedModule !== 'ALL') params.set('module', selectedModule);
      params.set('limit', '150');

      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: { 'Authorization': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  }, [adminToken, search, selectedModule]);

  useEffect(() => {
    const timer = setTimeout(loadLogs, 250);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  async function handleClearLogs() {
    try {
      const res = await fetch('/api/admin/logs', {
        method: 'DELETE',
        headers: { 'Authorization': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        setConfirmClear(false);
        loadLogs();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Gagal membersihkan log: ' + err.message);
    }
  }

  function getActionBadge(action) {
    switch (action) {
      case 'USER_CREATE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">User Baru</span>;
      case 'USER_UPDATE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Update User</span>;
      case 'USER_DELETE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Hapus User</span>;
      case 'PASSWORD_RESET':
      case 'PASSWORD_CHANGE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Reset Password</span>;
      case 'LOGIN':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Login</span>;
      case 'LOGIN_FAILED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Login Gagal</span>;
      case 'ITEM_CREATE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Tambah Item</span>;
      case 'ITEM_UPDATE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Edit Item</span>;
      case 'ITEM_DELETE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Hapus Item</span>;
      case 'STOCK_SYNC':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Sync Stok</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{action}</span>;
    }
  }

  function getModuleIcon(module) {
    switch (module) {
      case 'USERS':
        return <User className="w-3.5 h-3.5 text-purple-600" />;
      case 'AUTH':
        return <Key className="w-3.5 h-3.5 text-amber-600" />;
      case 'CATALOG':
        return <Package className="w-3.5 h-3.5 text-sky-600" />;
      case 'STOK':
        return <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-slate-500" />;
    }
  }

  function formatTime(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      const datePart = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${datePart}, ${timePart}`;
    } catch {
      return isoStr;
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Log Aktifitas Pengguna &amp; Audit Trail
          </h2>
          <p className="text-xs text-slate-500">
            Catatan riwayat seluruh tindakan sistem: penambahan user, reset password, update produk, dan sinkronisasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {confirmClear ? (
            <div className="flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-300 rounded-xl">
              <span className="text-xs font-bold text-rose-700 px-2">Bersihkan semua log?</span>
              <button
                onClick={handleClearLogs}
                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
              >
                Ya, Bersihkan
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-rose-300 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Log</span>
            </button>
          )}

          <button
            onClick={loadLogs}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama user, username, deskripsi aksi, atau kata kunci..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <select
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium"
        >
          <option value="ALL">Semua Modul</option>
          <option value="USERS">Kelola User (USERS)</option>
          <option value="AUTH">Autentikasi &amp; Password (AUTH)</option>
          <option value="CATALOG">Katalog Produk (CATALOG)</option>
          <option value="STOK">Sinkronisasi Stok (STOK)</option>
          <option value="SYSTEM">Sistem &amp; Server (SYSTEM)</option>
        </select>

        <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">
          Menampilkan: <strong className="text-slate-900">{logs.length}</strong> dari {total} log
        </span>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-44">Waktu</th>
                <th className="py-3 px-3 w-44">Pengguna</th>
                <th className="py-3 px-3 w-32">Modul &amp; Aksi</th>
                <th className="py-3 px-4">Deskripsi Tindakan</th>
                <th className="py-3 px-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                      <span>Memuat log aktifitas...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Tidak ada log aktifitas yang sesuai dengan filter Anda.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Time */}
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatTime(log.created_at)}</span>
                      </div>
                    </td>

                    {/* User */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {log.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">
                            {log.full_name || log.username}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            @{log.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Module & Action */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase">
                          {getModuleIcon(log.module)}
                          <span>{log.module}</span>
                        </div>
                        <div>
                          {getActionBadge(log.action)}
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {log.description}
                      </p>
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
