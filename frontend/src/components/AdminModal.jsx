import React, { useState } from 'react';
import { X, Lock, PlusCircle, CheckCircle } from 'lucide-react';

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
        onClose();
      } else {
        setError(data.message || 'Password admin salah');
      }
    } catch (err) {
      setError('Gagal menghubungi server: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Login Admin</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Masukkan password admin untuk menambah atau mengedit produk katalog aksesoris.
        </p>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Password Admin
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              autoFocus
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold hover:bg-sky-800 disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export function AddProductModal({ isOpen, onClose, adminToken, onProductAdded }) {
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    item_alias: '',
    barcode: '',
    brand: 'UGREEN',
    category: 'Kabel Data & Charging',
    official_sku: '',
    official_name: '',
    main_spec: '',
    detail_spec: '',
    interface: '',
    compatibility: '',
    color: 'Black',
    image_url: '',
    official_store_url: '',
    status_data: 'Lengkap'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        onProductAdded();
        onClose();
      } else {
        setError(data.message || 'Gagal menyimpan produk');
      }
    } catch (err) {
      setError('Kesalahan koneksi: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Tambah Produk Baru (17 Kolom)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Item (Wajib Sesuai POS/ERP)</label>
              <input
                type="text"
                name="item_code"
                value={formData.item_code}
                onChange={handleChange}
                placeholder="003099"
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Barcode / EAN</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="692279474..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Merk / Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="UGREEN / VENTION / ROBOT"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Produk</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Kabel Data / Batok Charger / TWS"
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Produk Lengkap (Official)</label>
            <input
              type="text"
              name="official_name"
              value={formData.official_name}
              onChange={handleChange}
              placeholder="Contoh: Ugreen USB-C to USB-C 100W Fast Charging Cable 1M"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Item di POS/ERP</label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                placeholder="UGREEN KABEL TIPE C"
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU / Model Resmi</label>
              <input
                type="text"
                name="official_sku"
                value={formData.official_sku}
                onChange={handleChange}
                placeholder="US261 / 15283"
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Spesifikasi Utama</label>
            <textarea
              name="main_spec"
              value={formData.main_spec}
              onChange={handleChange}
              rows={2}
              placeholder="Output 100W (20V/5A), Panjang 1 Meter, E-Marker Chip..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Spesifikasi Detail & Fitur Teknis</label>
            <textarea
              name="detail_spec"
              value={formData.detail_spec}
              onChange={handleChange}
              rows={2}
              placeholder="Kecepatan transfer data 480Mbps, material nylon braided..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Konektor / Interface</label>
              <input
                type="text"
                name="interface"
                value={formData.interface}
                onChange={handleChange}
                placeholder="USB Type-C to Type-C"
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kompatibilitas Perangkat / OS</label>
              <input
                type="text"
                name="compatibility"
                value={formData.compatibility}
                onChange={handleChange}
                placeholder="iPhone 15/16, iPad, MacBook, Android, Windows"
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">URL Foto Produk (atau simpan di public/images/products/)</label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Link Toko Resmi / Official Store</label>
              <input
                type="text"
                name="official_store_url"
                value={formData.official_store_url}
                onChange={handleChange}
                placeholder="https://tokopedia.com/..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-sky-700 text-white font-bold hover:bg-sky-800 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
