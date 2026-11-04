import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Edit2, Trash2, X, Check, Eye, AlertCircle, RefreshCw, 
  FileSpreadsheet, FileDown, Camera, Image
} from 'lucide-react';
import { getProductImageSrc, getProductPlaceholderSrc, getBrandTheme } from '../../utils/productUtils';
import ImportExcelModal from './ImportExcelModal';

export default function ItemsManager({ adminToken, onStatsUpdated }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState(getInitialForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  // Import Excel State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Delete State
  const [deleteConfirmCode, setDeleteConfirmCode] = useState(null);

  function getInitialForm() {
    return {
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
    };
  }

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (selectedBrand !== 'ALL') params.set('brand', selectedBrand);
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.brands && brands.length === 0) setBrands(data.brands);
        if (data.categories && categories.length === 0) setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedBrand, selectedCategory, brands.length, categories.length]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 250);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  function handleOpenCreate() {
    setFormData(getInitialForm());
    setModalMode('create');
    setEditingCode(null);
    setFormError('');
    setIsModalOpen(true);
  }

  function handleOpenEdit(product) {
    setFormData({
      item_code: product.item_code || '',
      item_name: product.item_name || '',
      item_alias: product.item_alias || '',
      barcode: product.barcode || '',
      brand: product.brand || '',
      category: product.category || '',
      official_sku: product.official_sku || '',
      official_name: product.official_name || '',
      main_spec: product.main_spec || '',
      detail_spec: product.detail_spec || '',
      interface: product.interface || '',
      compatibility: product.compatibility || '',
      color: product.color || '',
      image_url: product.image_url || '',
      official_store_url: product.official_store_url || '',
      status_data: product.status_data || 'Lengkap'
    });
    setModalMode('edit');
    setEditingCode(product.item_code);
    setFormError('');
    setIsModalOpen(true);
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const url = modalMode === 'create'
        ? '/api/products'
        : `/api/products/${encodeURIComponent(editingCode)}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        loadProducts();
        if (onStatsUpdated) onStatsUpdated();
      } else {
        setFormError(data.message || 'Gagal menyimpan produk');
      }
    } catch (err) {
      setFormError('Kesalahan server: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteProduct(code) {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: { 'Authorization': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmCode(null);
        loadProducts();
        if (onStatsUpdated) onStatsUpdated();
      } else {
        alert(data.message || 'Gagal menghapus produk');
      }
    } catch (err) {
      alert('Kesalahan server: ' + err.message);
    }
  }

  async function handleDownloadTemplateDirect() {
    setDownloadingTemplate(true);
    try {
      const res = await fetch('/api/admin/template-excel', {
        headers: { 'Authorization': adminToken }
      });
      if (!res.ok) throw new Error('Gagal mengunduh template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Import_Katalog_Aksesoris.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error saat mengunduh template: ' + err.message);
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleFileUpload(file, targetItemCode = null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB');
      return;
    }

    setUploadingImage(true);
    setImageUploadError('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result;
        const code = targetItemCode || formData.item_code;
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': adminToken
          },
          body: JSON.stringify({
            imageBase64: base64,
            fileName: file.name,
            itemCode: code
          })
        });
        const data = await res.json();
        if (data.success) {
          if (targetItemCode) {
            // Quick upload from table: update product in list directly!
            setProducts(prev => prev.map(p => p.item_code === targetItemCode ? { ...p, image_url: data.imageUrl } : p));
            alert('Foto produk berhasil diperbarui!');
          } else {
            // In modal form: set formData.image_url
            setFormData(prev => ({ ...prev, image_url: data.imageUrl }));
          }
        } else {
          setImageUploadError(data.message || 'Gagal mengunggah foto');
          alert(data.message || 'Gagal mengunggah foto');
        }
      } catch (err) {
        setImageUploadError('Kesalahan jaringan: ' + err.message);
        alert('Kesalahan jaringan saat mengunggah foto: ' + err.message);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Kelola Item Produk ({products.length} Item)
          </h2>
          <p className="text-xs text-slate-500">
            Daftar lengkap 17 kolom katalog aksesoris dan spesifikasi produk knowledge
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template Button */}
          <button
            type="button"
            onClick={handleDownloadTemplateDirect}
            disabled={downloadingTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50"
            title="Download Template Format Excel (.xlsx)"
          >
            <FileDown className={`w-4 h-4 text-sky-600 ${downloadingTemplate ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">Template Excel</span>
          </button>

          {/* Import Excel Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            title="Import Banyak Produk dari File Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          {/* Add Item Manual Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode item, nama resmi, barcode, atau SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <select
          value={selectedBrand}
          onChange={e => setSelectedBrand(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium"
        >
          <option value="ALL">Semua Brand ({brands.length})</option>
          {brands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium max-w-[200px] truncate"
        >
          <option value="ALL">Semua Kategori ({categories.length})</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          onClick={loadProducts}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          title="Refresh Tabel"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-16">Foto</th>
                <th className="py-3 px-3">Kode / Barcode</th>
                <th className="py-3 px-4">Nama Produk Resmi &amp; SKU</th>
                <th className="py-3 px-3">Brand &amp; Kategori</th>
                <th className="py-3 px-3 text-center">Stok Total</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                      <span>Memuat data produk...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian / filter Anda.
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => {
                  const theme = getBrandTheme(p.brand);
                  const imgSrc = getProductImageSrc(p);

                  return (
                    <tr key={p.item_code} className="hover:bg-slate-50/70 transition">
                      
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {p.item_no || idx + 1}
                      </td>

                      {/* Image Thumbnail with Direct Quick Upload */}
                      <td className="py-2.5 px-3">
                        <div className="relative group w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                          <img
                            src={imgSrc}
                            alt={p.official_name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getProductPlaceholderSrc(p.brand, p.category, p.item_code);
                            }}
                          />
                          <label 
                            className="absolute inset-0 bg-slate-900/75 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-[9px] font-bold text-center p-0.5"
                            title="Ganti Foto Produk Ini Langsung"
                          >
                            <Camera className="w-3.5 h-3.5 mb-0.5 text-sky-400" />
                            <span>Ganti</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(e.target.files[0], p.item_code);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </td>

                      {/* Code & Barcode */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-sky-900 block font-mono">
                          {p.item_code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate block max-w-[120px]">
                          {p.barcode || '-'}
                        </span>
                      </td>

                      {/* Official Name & SKU */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-slate-800 line-clamp-2 leading-tight block">
                          {p.official_name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                          SKU: {p.official_sku || '-'}
                        </span>
                      </td>

                      {/* Brand & Category */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${theme.tag} mb-1`}>
                          {p.brand}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">
                          {p.category}
                        </span>
                      </td>

                      {/* Total Stock */}
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                          (p.totalNetworkStock || 0) > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {p.totalNetworkStock || 0} Pcs
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:text-sky-700 text-slate-600 transition"
                            title="Edit Produk 17 Kolom"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          {deleteConfirmCode === p.item_code ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-300 p-1 rounded-lg">
                              <span className="text-[10px] font-bold text-rose-700 px-1">Hapus?</span>
                              <button
                                onClick={() => handleDeleteProduct(p.item_code)}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                              >
                                Ya
                              </button>
                              <button
                                onClick={() => setDeleteConfirmCode(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmCode(p.item_code)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-400 hover:text-rose-600 text-slate-400 transition"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (17 KOLOM TAMBAH / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {modalMode === 'create' ? 'Tambah Item Baru' : `Edit Item [${editingCode}]`}
                </h3>
                <p className="text-xs text-slate-500">
                  Data 17 kolom standar katalog aksesoris &amp; product knowledge
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    1. Kode Item (ERP / POS) *
                  </label>
                  <input
                    type="text"
                    value={formData.item_code}
                    onChange={e => setFormData({ ...formData, item_code: e.target.value })}
                    disabled={modalMode === 'edit'}
                    placeholder="003099"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold disabled:bg-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    2. Barcode / EAN
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="692279474..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    3. Merk / Brand *
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value.toUpperCase() })}
                    placeholder="UGREEN / VENTION / ROBOT"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    4. Kategori Produk *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Kabel Data & Charging / Batok Charger"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  5. Nama Produk Lengkap (Official) *
                </label>
                <input
                  type="text"
                  value={formData.official_name}
                  onChange={e => setFormData({ ...formData, official_name: e.target.value })}
                  placeholder="Contoh: Ugreen USB-C to USB-C 100W Fast Charging Cable 1M"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    6. Nama Item di POS/ERP
                  </label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="UGREEN KABEL TYPE C"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    7. SKU / Model Resmi Pabrik
                  </label>
                  <input
                    type="text"
                    value={formData.official_sku}
                    onChange={e => setFormData({ ...formData, official_sku: e.target.value })}
                    placeholder="US261 / 15283"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  8. Spesifikasi Utama
                </label>
                <textarea
                  value={formData.main_spec}
                  onChange={e => setFormData({ ...formData, main_spec: e.target.value })}
                  rows={2}
                  placeholder="Output 100W (20V/5A), Panjang 1 Meter, E-Marker Chip..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  9. Spesifikasi Detail &amp; Fitur Teknis
                </label>
                <textarea
                  value={formData.detail_spec}
                  onChange={e => setFormData({ ...formData, detail_spec: e.target.value })}
                  rows={2}
                  placeholder="Kecepatan transfer data 480Mbps, material nylon braided..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    10. Konektor / Interface
                  </label>
                  <input
                    type="text"
                    value={formData.interface}
                    onChange={e => setFormData({ ...formData, interface: e.target.value })}
                    placeholder="USB Type-C to Type-C"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    11. Kompatibilitas Perangkat / OS
                  </label>
                  <input
                    type="text"
                    value={formData.compatibility}
                    onChange={e => setFormData({ ...formData, compatibility: e.target.value })}
                    placeholder="iPhone 15/16, iPad, MacBook, Android, Windows"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    12. Warna / Varian
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Black / Grey / White"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    13. Status Data
                  </label>
                  <select
                    value={formData.status_data}
                    onChange={e => setFormData({ ...formData, status_data: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  >
                    <option value="Lengkap">Lengkap</option>
                    <option value="Perlu Verifikasi">Perlu Verifikasi</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* SECTION: FOTO PRODUK LANGSUNG & LINK TOKO */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs sm:text-sm">
                    14. Foto Produk (Upload Langsung dari Perangkat atau URL)
                  </label>
                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview Box */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-xs group">
                    <img
                      src={formData.image_url || getProductPlaceholderSrc(formData.brand, formData.category, formData.item_code)}
                      alt="Preview Produk"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getProductPlaceholderSrc(formData.brand, formData.category, formData.item_code);
                      }}
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                        <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
                        <span>Mengunggah...</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & URL input */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs">
                        <Camera className="w-4 h-4" />
                        <span>{uploadingImage ? 'Mengunggah...' : 'Pilih Foto dari Perangkat'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      <span className="text-[11px] text-slate-400">
                        JPG, PNG, WebP (Maks 10MB)
                      </span>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="text"
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="Atau tempel URL gambar eksternal (https://...)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                    
                    <p className="text-[10px] text-slate-500">
                      Foto otomatis di-upload dan tersimpan di server lokal <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">public/images/products/</code>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  15. Link Toko Resmi / Official Store
                </label>
                <input
                  type="text"
                  value={formData.official_store_url}
                  onChange={e => setFormData({ ...formData, official_store_url: e.target.value })}
                  placeholder="https://tokopedia.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-sky-700 text-white font-bold hover:bg-sky-800 disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : (modalMode === 'create' ? 'Tambah Produk' : 'Simpan Perubahan')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        adminToken={adminToken}
        onSuccess={() => {
          loadProducts();
          if (onStatsUpdated) onStatsUpdated();
        }}
      />

    </div>
  );
}
