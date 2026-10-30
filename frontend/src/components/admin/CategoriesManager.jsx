import React, { useState, useEffect } from 'react';
import { Tag, Bookmark, Edit2, Trash2, Plus, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import { getBrandTheme } from '../../utils/productUtils';

export default function CategoriesManager({ adminToken, onStatsUpdated }) {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'brands'
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit / Rename Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState('category'); // 'category' or 'brand'
  const [oldName, setOldName] = useState('');
  const [newName, setNewName] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete Category State
  const [deleteCatName, setDeleteCatName] = useState(null);

  // Add New Category State
  const [newCatInput, setNewCatInput] = useState('');
  const [addCatLoading, setAddCatLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const headers = { 'Authorization': adminToken };
      const [resCat, resBrand] = await Promise.all([
        fetch('/api/admin/categories', { headers }),
        fetch('/api/admin/brands', { headers })
      ]);
      const dataCat = await resCat.json();
      const dataBrand = await resBrand.json();

      if (dataCat.success) setCategories(dataCat.categories || []);
      if (dataBrand.success) setBrands(dataBrand.brands || []);
    } catch (err) {
      console.error('Error loading categories & brands:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenRename(type, currentName) {
    setEditType(type);
    setOldName(currentName);
    setNewName(currentName);
    setModalError('');
    setIsEditModalOpen(true);
  }

  async function handleSaveRename(e) {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === oldName) {
      setIsEditModalOpen(false);
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const endpoint = editType === 'category' ? '/api/admin/categories' : '/api/admin/brands';
      const body = editType === 'category'
        ? { oldCategory: oldName, newCategory: newName.trim() }
        : { oldBrand: oldName, newBrand: newName.trim().toUpperCase() };

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        setIsEditModalOpen(false);
        loadData();
        if (onStatsUpdated) onStatsUpdated();
      } else {
        setModalError(data.message || 'Gagal mengubah nama');
      }
    } catch (err) {
      setModalError('Kesalahan server: ' + err.message);
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDeleteCategory(categoryName) {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ category: categoryName, fallbackCategory: 'Aksesoris / Lainnya' })
      });
      const data = await res.json();
      if (data.success) {
        setDeleteCatName(null);
        loadData();
        if (onStatsUpdated) onStatsUpdated();
      } else {
        alert(data.message || 'Gagal menghapus kategori');
      }
    } catch (err) {
      alert('Kesalahan server: ' + err.message);
    }
  }

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Kelola Kategori &amp; Merk Produk
          </h2>
          <p className="text-xs text-slate-500">
            Kelompokkan aksesoris secara rapi agar mudah dicari kasir dan staff toko
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'categories'
                ? 'bg-white text-sky-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Kategori ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'brands'
                ? 'bg-white text-sky-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Merk / Brand ({brands.length})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder={activeTab === 'categories' ? 'Cari nama kategori...' : 'Cari nama brand...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
        />
        <button
          onClick={loadData}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'categories' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              Memuat daftar kategori...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              Tidak ada kategori yang cocok dengan "{search}".
            </div>
          ) : (
            filteredCategories.map(c => (
              <div
                key={c.name}
                className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 text-xs truncate" title={c.name}>
                    {c.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {c.count} Produk Terdaftar
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenRename('category', c.name)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:text-sky-700 text-slate-600 transition"
                    title="Ubah Nama Kategori"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {deleteCatName === c.name ? (
                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 p-1 rounded-lg">
                      <button
                        onClick={() => handleDeleteCategory(c.name)}
                        className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                        title="Hapus kategori dan pindahkan produk ke 'Aksesoris / Lainnya'"
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => setDeleteCatName(null)}
                        className="px-1 py-0.5 text-slate-500 text-[10px]"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteCatName(c.name)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-400 hover:text-rose-600 text-slate-400 transition"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              Memuat daftar brand...
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              Tidak ada brand yang cocok dengan "{search}".
            </div>
          ) : (
            filteredBrands.map(b => {
              const theme = getBrandTheme(b.name);
              return (
                <div
                  key={b.name}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-black uppercase border ${theme.tag} mb-1`}>
                      {b.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {b.count} Produk Aktif
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenRename('brand', b.name)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:text-sky-700 text-slate-600 transition"
                    title="Ubah Nama Brand"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* RENAME MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editType === 'category' ? 'Ganti Nama Kategori' : 'Ganti Nama Brand'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Mengubah nama ini akan otomatis memperbarui seluruh produk yang menggunakan nama <strong>"{oldName}"</strong>.
            </p>

            {modalError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Baru
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold hover:bg-sky-800 disabled:opacity-50"
                >
                  {modalLoading ? 'Menyimpan...' : 'Simpan Nama'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
