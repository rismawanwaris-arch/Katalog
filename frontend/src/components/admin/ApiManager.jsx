import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle2, AlertTriangle, RefreshCw, Send, Radio, Server, Store } from 'lucide-react';

export default function ApiManager({ adminToken, onStatsUpdated }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiUrlInput, setApiUrlInput] = useState('');
  
  // Test State
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Sync State
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Save State
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/api-config', {
        headers: { 'Authorization': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data);
        setApiUrlInput(data.stockApiUrl || 'http://localhost:3500');
      }
    } catch (err) {
      console.error('Error loading API config:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  async function handleTestApi() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ url: apiUrlInput })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, online: false, message: 'Gagal menghubungi server lokal: ' + err.message });
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveConfig(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/admin/api-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ stockApiUrl: apiUrlInput })
      });
      const data = await res.json();
      setSaveMessage(data.message);
      if (data.success) {
        loadConfig();
        if (onStatsUpdated) onStatsUpdated();
      }
    } catch (err) {
      setSaveMessage('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleForceSync() {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/sync-stock', { method: 'POST' });
      const data = await res.json();
      setSyncMessage(data.message + ` (${data.totalItemsInStock || 0} item berhasil dicocokkan)`);
      loadConfig();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      setSyncMessage('Gagal sinkronisasi: ' + err.message);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
        <span>Memeriksa status integrasi API...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Integrasi API Stok (LaporanStcok)
            </h2>
            <p className="text-xs text-slate-500">
              Konfigurasi koneksi real-time ke server stok untuk sinkronisasi otomatis 43 cabang
            </p>
          </div>

          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Stok Sekarang'}</span>
          </button>
        </div>

        {syncMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}
      </div>

      {/* Status Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: API Endpoint */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Server className="w-4 h-4 text-sky-600" />
            <span>Endpoint Server</span>
          </div>
          <span className="font-bold text-slate-900 font-mono text-xs block truncate" title={config?.stockApiUrl}>
            {config?.stockApiUrl || '-'}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online via Tailscale
          </span>
        </div>

        {/* Card 2: Report Date */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Tanggal Laporan Aktif</span>
          </div>
          <span className="font-extrabold text-slate-900 text-sm block">
            {config?.reportDate || 'Belum Sinkron'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Tanggal data stok terakhir
          </span>
        </div>

        {/* Card 3: Outlets Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Store className="w-4 h-4 text-purple-600" />
            <span>Cabang Terdaftar</span>
          </div>
          <span className="font-extrabold text-slate-900 text-sm block">
            {config?.totalOutlets || 0} Toko Cabang
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Area Bandung &amp; sekitarnya
          </span>
        </div>

        {/* Card 4: Cached Stock Items */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Globe className="w-4 h-4 text-amber-600" />
            <span>Item Stok di-Cache</span>
          </div>
          <span className="font-extrabold text-slate-900 text-sm block">
            {config?.cachedItemsCount || 0} Kode Item
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Tersimpan di memori server
          </span>
        </div>

      </div>

      {/* API URL Configuration & Ping Form */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-1">
          Ubah Alamat / URL API Stok
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Ganti URL ini jika server LaporanStcok berpindah IP atau port (misal ganti Tailscale IP baru)
        </p>

        {saveMessage && (
          <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
            {saveMessage}
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Server LaporanStcok
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={apiUrlInput}
                onChange={e => setApiUrlInput(e.target.value)}
                placeholder="http://ip-server:3500"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              />
              <button
                type="button"
                onClick={handleTestApi}
                disabled={testing}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testing ? 'Menguji...' : 'Uji Koneksi (Test Ping)'}</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition"
              >
                <span>{saving ? 'Menyimpan...' : 'Simpan URL'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Test Result Box */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-xl border text-xs ${
            testResult.online
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {testResult.online ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              )}
              <span>Hasil Uji Koneksi: {testResult.online ? 'TERHUBUNG (ONLINE)' : 'TERPUTUS / GAGAL'}</span>
            </div>
            <p className="text-slate-600 mb-1">{testResult.message}</p>
            {testResult.online && (
              <div className="flex gap-4 text-[11px] font-mono text-slate-500 mt-2 pt-2 border-t border-emerald-200">
                <span>Latency: <strong>{testResult.latencyMs} ms</strong></span>
                <span>Jumlah Tanggal Laporan: <strong>{testResult.datesCount}</strong></span>
                <span>Laporan Terbaru: <strong>{testResult.latestDate}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Outlets Grid */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-1">
          Daftar Toko Cabang Terdeteksi ({config?.totalOutlets || 0} Toko)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Daftar cabang ini otomatis ditarik dari database server LaporanStcok
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {(config?.outlets || []).map((o, idx) => (
            <div
              key={o}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700 truncate"
              title={o}
            >
              <span className="text-slate-400 font-mono mr-1">{idx + 1}.</span> {o}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
