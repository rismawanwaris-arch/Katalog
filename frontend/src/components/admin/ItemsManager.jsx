import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Edit2, Trash2, X, Check, Eye, AlertCircle, RefreshCw, 
  FileSpreadsheet, FileDown, Camera, Image, ArrowUpDown, Images
} from 'lucide-react';
import { getProductImageSrc, getProductPlaceholderSrc, getBrandTheme, formatRupiah } from '../../utils/productUtils';
import ImportExcelModal from './ImportExcelModal';
import ProductGalleryModal from './ProductGalleryModal';

export default function ItemsManager({ adminToken, onStatsUpdated }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState(getInitialForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Image Upload & Gallery Modal State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [galleryModalProduct, setGalleryModalProduct] = useState(null);

  // Import Excel State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Delete State
  const [deleteConfirmCode, setDeleteConfirmCode] = useState(null);

  // Multi-select Checkbox State
  const [selectedCodes, setSelectedCodes] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  function toggleSelectCode(code) {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  const allPageSelected = products.length > 0 && products.every(p => selectedCodes.has(p.item_code));

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedCodes(prev => {
        const next = new Set(prev);
        products.forEach(p => next.delete(p.item_code));
        return next;
      });
    } else {
      setSelectedCodes(prev => {
        const next = new Set(prev);
        products.forEach(p => next.add(p.item_code));
        return next;
      });
    }
  }

  function clearSelection() {
    setSelectedCodes(new Set());
  }

  async function handleBulkDelete() {
    if (selectedCodes.size === 0) return;
    setBulkDeleting(true);
    try {
      const res = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({
          codes: Array.from(selectedCodes)
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsBulkDeleteModalOpen(false);
        clearSelection();
        loadProducts();
        if (onStatsUpdated) onStatsUpdated();
      } else {
        alert(data.message || 'Gagal menghapus data');
      }
    } catch (err) {
      alert('Kesalahan server: ' + err.message);
    } finally {
      setBulkDeleting(false);
    }
  }

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
      gallery_images: [],
      official_store_url: '',
      price: 0,
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
      if (sortBy !== 'default') params.set('sort', sortBy);

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
  }, [search, selectedBrand, selectedCategory, sortBy, brands.length, categories.length]);

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
      gallery_images: Array.isArray(product.gallery_images) && product.gallery_images.length > 0
        ? product.gallery_images
        : (product.image_url ? [product.image_url] : []),
      official_store_url: product.official_store_url || '',
      price: product.price || 0,
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

  async function handleExportExcel(customCodes = null) {
    setExporting(true);
    try {
      let url = '/api/admin/export-excel?';
      const params = new URLSearchParams();
      if (customCodes && customCodes.length > 0) {
        params.append('codes', customCodes.join(','));
      } else {
        if (search) params.append('q', search);
        if (selectedBrand && selectedBrand !== 'ALL') params.append('brand', selectedBrand);
        if (selectedCategory && selectedCategory !== 'ALL') params.append('category', selectedCategory);
        if (sortBy && sortBy !== 'default') params.append('sort', sortBy);
      }
      url += params.toString();

      const res = await fetch(url, {
        headers: { 'Authorization': adminToken }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal mengekspor data Excel');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `Katalog_Produk_Aksesoris_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Error saat mengekspor Excel: ' + err.message);
    } finally {
      setExporting(false);
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

  async function handleMultiFileUploadInForm(fileList) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      alert('Pilih file gambar yang valid (JPG, PNG, WebP, GIF)');
      return;
    }

    setUploadingImage(true);
    try {
      const results = [];
      for (const file of files) {
        const base64 = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });

        const resp = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': adminToken
          },
          body: JSON.stringify({
            imageBase64: base64,
            fileName: file.name,
            itemCode: formData.item_code || null
          })
        });
        const data = await resp.json();
        if (data.success && data.imageUrl) {
          results.push(data.imageUrl);
        }
      }

      if (results.length > 0) {
        setFormData(prev => {
          const current = Array.isArray(prev.gallery_images) ? [...prev.gallery_images] : [];
          results.forEach(r => {
            if (!current.includes(r)) current.push(r);
          });
          return {
            ...prev,
            gallery_images: current,
            image_url: prev.image_url || current[0] || ''
          };
        });
        alert(`Berhasil menambahkan ${results.length} foto!`);
      }
    } catch (err) {
      alert('Error saat mengunggah foto: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
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

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={() => handleExportExcel()}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50"
            title="Export Semua / Hasil Filter Produk ke Format Excel (.xlsx) Lengkap dengan Harga"
          >
            <FileSpreadsheet className={`w-4 h-4 text-sky-600 ${exporting ? 'animate-spin' : ''}`} />
            <span>{exporting ? 'Mengekspor...' : 'Export Excel'}</span>
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

        <div className="flex items-center gap-1.5 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium"
            title="Urutkan Tampilan Item"
          >
            <option value="default">Urutkan: Default</option>
            <option value="az">Abjad A - Z (Nama Resmi)</option>
            <option value="za">Abjad Z - A</option>
            <option value="price_asc">Harga Termurah</option>
            <option value="price_desc">Harga Termahal</option>
            <option value="category">Kategori (A - Z)</option>
          </select>
        </div>

        <button
          onClick={loadProducts}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          title="Refresh Tabel"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
        </button>
      </div>

      {/* Bulk Action Bar (Muncul saat ada item yang dicentang) */}
      {selectedCodes.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-fade-fast">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-950">
              {selectedCodes.size} produk terpilih
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-amber-800 hover:text-amber-950 underline font-semibold ml-1 cursor-pointer"
            >
              Batalkan Pilihan
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportExcel(Array.from(selectedCodes))}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Export hanya item-item yang dipilih ke Excel"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${exporting ? 'animate-spin' : ''}`} />
              <span>Export {selectedCodes.size} Terpilih</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedCodes.size} Item Terpilih</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    title="Pilih Semua Item di Halaman Ini"
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-16">Foto</th>
                <th className="py-3 px-3">Kode / Barcode</th>
                <th className="py-3 px-4">Nama Produk Resmi &amp; SKU</th>
                <th className="py-3 px-3">Brand &amp; Kategori</th>
                <th className="py-3 px-3 text-right">Harga (Rp)</th>
                <th className="py-3 px-3 text-center">Stok Total</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                      <span>Memuat data produk...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian / filter Anda.
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => {
                  const theme = getBrandTheme(p.brand);
                  const imgSrc = getProductImageSrc(p);
                  const isChecked = selectedCodes.has(p.item_code);

                  return (
                    <tr 
                      key={p.item_code} 
                      className={`transition ${isChecked ? 'bg-sky-50/80 hover:bg-sky-100/60' : 'hover:bg-slate-50/70'}`}
                    >
                      {/* Checkbox Row */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectCode(p.item_code)}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                        />
                      </td>
                      
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {p.item_no || idx + 1}
                      </td>

                      {/* Image Thumbnail with Direct Quick Upload & Multi-Gallery Opener */}
                      <td className="py-2.5 px-3">
                        <div 
                          onClick={() => setGalleryModalProduct(p)}
                          className="relative group w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs cursor-pointer hover:border-sky-400"
                          title="Klik untuk Kelola Galeri Foto (Bisa Tambah Lebih dari 1 Foto)"
                        >
                          <img
                            src={imgSrc}
                            alt={p.official_name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getProductPlaceholderSrc(p.brand, p.category, p.item_code);
                            }}
                          />
                          {/* Photo count indicator badge */}
                          {Array.isArray(p.gallery_images) && p.gallery_images.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-slate-900/85 text-white text-[9px] font-bold px-1 rounded-tl">
                              {p.gallery_images.length}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-slate-900/75 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[9px] font-bold text-center p-0.5">
                            <Images className="w-3.5 h-3.5 mb-0.5 text-sky-400" />
                            <span>Galeri</span>
                          </div>
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

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {p.price > 0 ? formatRupiah(p.price) : <span className="text-slate-300 font-normal">-</span>}
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
                          {/* Manage Gallery Button */}
                          <button
                            type="button"
                            onClick={() => setGalleryModalProduct(p)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:text-sky-700 text-slate-600 transition flex items-center gap-1 cursor-pointer"
                            title="Menu Kelola Galeri Foto (Bisa Tambah Lebih dari 1 Foto)"
                          >
                            <Images className="w-3.5 h-3.5 text-sky-600" />
                            <span className="text-[10px] font-bold">
                              {Array.isArray(p.gallery_images) && p.gallery_images.length > 0 ? `${p.gallery_images.length} Foto` : '+ Foto'}
                            </span>
                          </button>

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

              {/* SECTION: FOTO PRODUK LANGSUNG & GALERI FOTO */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-800 text-xs sm:text-sm">
                      14. Foto &amp; Galeri Produk (Bisa Tambah Lebih dari 1 Foto)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {(formData.gallery_images?.length || (formData.image_url ? 1 : 0))} Foto tersimpan
                    </span>
                  </div>

                  {modalMode === 'edit' && editingCode && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetProd = products.find(p => p.item_code === editingCode) || { ...formData, item_code: editingCode };
                        setGalleryModalProduct(targetProd);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Images className="w-3.5 h-3.5" />
                      <span>Buka Menu Kelola Galeri</span>
                    </button>
                  )}
                </div>

                {/* Gallery Thumbnails List in Form */}
                <div className="flex flex-wrap items-center gap-3">
                  {(formData.gallery_images && formData.gallery_images.length > 0
                    ? formData.gallery_images
                    : (formData.image_url ? [formData.image_url] : [])
                  ).map((imgUrl, idx) => (
                    <div
                      key={imgUrl + idx}
                      className="relative w-20 h-20 rounded-xl bg-white border-2 border-slate-200 overflow-hidden flex items-center justify-center p-1 shadow-2xs group"
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.src = getProductPlaceholderSrc(formData.brand, formData.category, formData.item_code); }}
                      />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-extrabold px-1 rounded shadow-xs">
                          UTAMA
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (formData.gallery_images || []).filter(u => u !== imgUrl);
                          setFormData({
                            ...formData,
                            gallery_images: updated,
                            image_url: updated[0] || ''
                          });
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                        title="Hapus foto ini"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Multi-upload Button Box */}
                  <label className="cursor-pointer w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 flex flex-col items-center justify-center text-slate-500 hover:text-sky-600 transition bg-white/70">
                    <Plus className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-bold text-center leading-tight">
                      {uploadingImage ? '...' : '+ Foto'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleMultiFileUploadInForm(e.target.files);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => {
                        let g = Array.isArray(prev.gallery_images) ? [...prev.gallery_images] : [];
                        if (val && !g.includes(val)) g.unshift(val);
                        return { ...prev, image_url: val, gallery_images: g };
                      });
                    }}
                    placeholder="Atau tempel URL gambar eksternal (https://...)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Mendukung upload banyak file foto sekaligus dari komputer/ponsel. Foto pertama menjadi cover katalog.
                  </p>
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

              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <label className="block font-bold text-emerald-950 mb-1 text-xs sm:text-sm">
                  16. Harga Jual Retail (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-700 text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })}
                    placeholder="Contoh: 35000 (Kosongkan jika belum ada harga)"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-emerald-300 bg-white font-mono font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                  />
                </div>
                <p className="text-[10px] text-emerald-700/80 mt-1">
                  Harga akan ditampilkan langsung di kartu produk pada halaman depan kasir
                </p>
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

      {/* Modal Konfirmasi Hapus Massal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-fast">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-slate-100 animate-modal-in gpu-accelerated">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Hapus {selectedCodes.size} Produk Sekaligus?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Anda akan menghapus data <strong className="text-slate-800">{selectedCodes.size} item produk</strong> yang telah Anda tandai. Tindakan ini permanen dan data yang dihapus tidak dapat dipulihkan kembali.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {bulkDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus {selectedCodes.size} Produk</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Gallery Modal (Menu Tambah Gambar Lebih dari 1) */}
      <ProductGalleryModal
        isOpen={!!galleryModalProduct}
        onClose={() => setGalleryModalProduct(null)}
        product={galleryModalProduct}
        adminToken={adminToken}
        onGalleryUpdated={(updated) => {
          setGalleryModalProduct(updated);
          setProducts(prev => prev.map(p => p.item_code === updated.item_code ? updated : p));
          if (formData.item_code === updated.item_code) {
            setFormData(prev => ({
              ...prev,
              image_url: updated.image_url,
              gallery_images: updated.gallery_images
            }));
          }
        }}
      />

    </div>
  );
}
