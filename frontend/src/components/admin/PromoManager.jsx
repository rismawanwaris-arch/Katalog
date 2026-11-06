import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Upload, 
  Image, 
  Trash2, 
  Save, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  Link as LinkIcon,
  Search,
  Plus,
  ShoppingBag,
  Package,
  Layers,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import PromoModal from '../PromoModal';

export default function PromoManager({ adminToken }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Main Promo Settings
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState('both'); // 'both', 'products', 'banner'
  const [badge, setBadge] = useState('PROMO SPESIAL');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionText, setActionText] = useState('Mulai Belanja & Cek Stok');
  const [actionFilter, setActionFilter] = useState('');

  // Selected Promo Products
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Product Search / Picker State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchPromoSettings();
  }, []);

  async function fetchPromoSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/promo');
      const data = await res.json();
      if (data.success && data.promo) {
        setEnabled(data.promo.enabled);
        setMode(data.promo.mode || 'both');
        setBadge(data.promo.badge || 'PROMO SPESIAL');
        setTitle(data.promo.title || '');
        setSubtitle(data.promo.subtitle || '');
        setImageUrl(data.promo.imageUrl || '');
        setActionText(data.promo.actionText || 'Mulai Belanja & Cek Stok');
        setActionFilter(data.promo.actionFilter || '');
        setSelectedProducts(data.promo.products || []);
      }
    } catch (err) {
      console.error('Error fetching promo:', err);
      setMessage({ type: 'error', text: 'Gagal memuat pengaturan promo: ' + err.message });
    } finally {
      setLoading(false);
    }
  }

  // Search Catalog Products for Picker
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success) {
          // Filter out already selected products
          const existingCodes = new Set(selectedProducts.map(p => p.item_code));
          const available = (data.products || []).filter(p => !existingCodes.has(p.item_code)).slice(0, 6);
          setSearchResults(available);
        }
      } catch (e) {
        console.error('Error searching products:', e);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedProducts]);

  function handleAddProduct(product) {
    const newPromoItem = {
      item_code: product.item_code,
      official_name: product.official_name,
      brand: product.brand,
      category: product.category,
      price: product.price || 0,
      promo_price: product.price > 0 ? Math.round(product.price * 0.85 / 1000) * 1000 : 0,
      promo_badge: 'Promo',
      image_url: product.image_url || '',
      outletStock: product.outletStock || 0,
      totalNetworkStock: product.totalNetworkStock || 0
    };

    setSelectedProducts(prev => [...prev, newPromoItem]);
    setSearchQuery('');
    setSearchResults([]);
  }

  function handleRemoveProduct(itemCode) {
    setSelectedProducts(prev => prev.filter(p => p.item_code !== itemCode));
  }

  function handleUpdateProductItem(itemCode, field, value) {
    setSelectedProducts(prev => prev.map(p => {
      if (p.item_code === itemCode) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Pack raw products for backend storage
    const productsToSave = selectedProducts.map(p => ({
      item_code: p.item_code,
      promo_badge: p.promo_badge || 'Promo',
      promo_price: Number(p.promo_price) || 0
    }));

    try {
      const res = await fetch('/api/admin/promo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({
          enabled,
          mode,
          badge,
          title,
          subtitle,
          imageUrl,
          actionText,
          actionFilter,
          products: productsToSave
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Pengaturan teks banner & produk promo berhasil disimpan dan langsung aktif di halaman depan!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal menyimpan pengaturan.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  // Handle Image File Upload
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar (JPG, PNG, WebP) yang diizinkan!');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 8 MB!');
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imageBase64 = reader.result;
        const res = await fetch('/api/admin/promo/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': adminToken
          },
          body: JSON.stringify({
            imageBase64,
            fileName: file.name
          })
        });

        const data = await res.json();
        if (data.success && data.imageUrl) {
          setImageUrl(data.imageUrl);
          setMessage({ type: 'success', text: 'Poster gambar berhasil diunggah!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } else {
          setMessage({ type: 'error', text: data.message || 'Gagal mengunggah gambar.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Gagal mengunggah: ' + err.message });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function formatRp(val) {
    const num = Number(val) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
        <p className="text-sm">Memuat pengaturan promo popup...</p>
      </div>
    );
  }

  const previewPromoData = {
    enabled: true,
    mode,
    badge: badge || 'PROMO SPESIAL',
    title: title || 'PROMO AKSESORIS PILIHAN',
    subtitle: subtitle || 'Dapatkan penawaran harga spesial untuk produk original di bawah ini selagi stok tersedia!',
    imageUrl,
    actionText: actionText || 'Mulai Belanja & Cek Stok',
    actionFilter,
    products: selectedProducts
  };

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Konsol Pengaturan Banner &amp; Produk Promo Popup
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Ubah teks judul, badge diskon, dan pilih item katalog yang ingin ditampilkan di popup promo depan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Pratinjau (Preview)</span>
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-md shadow-sky-700/20 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid Setting Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Text Configuration & Product Selector */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. KONTROL TEKS BANNER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              1. Pengaturan Teks Banner Promo
            </h3>

            {/* Toggle Status & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Status Popup</span>
                  <span className="text-[11px] text-slate-500">
                    {enabled ? 'Aktif di halaman depan' : 'Dinonaktifkan'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enabled} 
                    onChange={e => setEnabled(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Tipe Tampilan
                </label>
                <select
                  value={mode}
                  onChange={e => setMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-500 bg-white"
                >
                  <option value="both">Produk Pilihan + Banner Gambar</option>
                  <option value="products">Hanya Produk Pilihan Promo</option>
                  <option value="banner">Hanya Banner Gambar / Gradient</option>
                </select>
              </div>
            </div>

            {/* Badge & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Badge / Label Promo
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={e => setBadge(e.target.value)}
                  placeholder="Contoh: FLASH SALE / SPESIAL HARI INI"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Judul Promo (Headline)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: PROMO AKSESORIS PILIHAN MINGGU INI"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Keterangan / Deskripsi Singkat
              </label>
              <textarea
                rows={2}
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Tuliskan keterangan promo atau pesan untuk kasir/pelanggan..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700 resize-none"
              />
            </div>

            {/* Action Buttons Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Teks Tombol Aksi
                </label>
                <input
                  type="text"
                  value={actionText}
                  onChange={e => setActionText(e.target.value)}
                  placeholder="Mulai Belanja & Cek Stok"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Filter Otomatis Saat Diklik (Opsional)
                </label>
                <input
                  type="text"
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                  placeholder="Contoh: Kabel Data / REXI / Charger"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* 2. PILIHAN PRODUK UNTUK DIJADIKAN PROMO */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-sky-700" />
                  2. Produk Pilihan Promo (Item Terpilih: {selectedProducts.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cari barang dari katalog dan tambahkan ke daftar promo. Anda bisa atur badge diskon &amp; harga promonya!
                </p>
              </div>
            </div>

            {/* Product Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik nama produk, merk, atau kode barang untuk ditambahkan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              {searching && (
                <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-sky-600" />
              )}

              {/* Search Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {searchResults.map(p => (
                    <button
                      key={p.item_code}
                      type="button"
                      onClick={() => handleAddProduct(p)}
                      className="w-full flex items-center justify-between p-3 hover:bg-sky-50 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-sky-700 uppercase block leading-none">
                            {p.brand} • {p.item_code}
                          </span>
                          <h6 className="text-xs font-bold text-slate-800 truncate mt-0.5">
                            {p.official_name}
                          </h6>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-slate-700">
                          {formatRp(p.price)}
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-bold flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Tambah
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List of Selected Promo Products */}
            {selectedProducts.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Belum ada produk promo yang dipilih</p>
                <p className="text-[11px] text-slate-400">Gunakan kotak pencarian di atas untuk menambahkan barang ke promo.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedProducts.map((item, idx) => (
                  <div
                    key={item.item_code}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    {/* Item Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                          {item.brand} • Kode: {item.item_code}
                        </span>
                        <h5 className="text-xs font-bold text-slate-800 truncate">
                          {item.official_name}
                        </h5>
                        <span className="text-[11px] text-slate-400">
                          Harga Normal: <strong className="text-slate-700">{formatRp(item.price)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Promo Customizations: Badge & Promo Price */}
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Badge / Label
                        </label>
                        <input
                          type="text"
                          value={item.promo_badge || ''}
                          onChange={e => handleUpdateProductItem(item.item_code, 'promo_badge', e.target.value)}
                          placeholder="Diskon 20%"
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-amber-700 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Harga Promo (Rp)
                        </label>
                        <input
                          type="number"
                          value={item.promo_price || ''}
                          onChange={e => handleUpdateProductItem(item.item_code, 'promo_price', e.target.value)}
                          placeholder="Harga Promo"
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.item_code)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition self-end sm:self-auto cursor-pointer"
                        title="Hapus dari Promo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Column: Banner Image Upload */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <span className="text-xs font-bold text-slate-800 block uppercase tracking-wider flex items-center gap-1.5">
              <Image className="w-4 h-4 text-sky-600" />
              Gambar Banner Tambahan (Opsional)
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jika Anda ingin menampilkan gambar poster di atas produk promo, Anda bisa mengunggahnya di sini.
            </p>

            {/* Image Preview Box */}
            <div className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-3 text-center">
              {uploading ? (
                <div className="flex flex-col items-center justify-center text-sky-600">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-xs font-bold">Mengunggah Poster...</span>
                </div>
              ) : imageUrl ? (
                <div className="relative w-full h-full group">
                  <img
                    src={imageUrl}
                    alt="Poster Promo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Image className="w-10 h-10 stroke-[1.5] mb-2" />
                  <span className="text-xs font-bold text-slate-600 mb-0.5">Tidak Ada Gambar Poster</span>
                  <p className="text-[11px] text-slate-400 max-w-[200px]">
                    Popup akan langsung menampilkan kartu produk pilihan promo.
                  </p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <label className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-sky-700" />
                <span>Upload Banner Gambar</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Format: JPG, PNG, atau WebP (Maks. 8 MB)
              </p>
            </div>

            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="w-full py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold text-center cursor-pointer"
              >
                Hapus Gambar (Hanya Teks &amp; Produk)
              </button>
            )}

            {/* URL input */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Atau Masukkan URL Banner
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

          </div>
        </div>

      </div>

      {/* Preview Modal */}
      <PromoModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        promo={previewPromoData}
        onActionClick={() => {
          alert('Pratinjau: Tombol aksi diklik');
        }}
        onSelectProduct={(code) => {
          alert('Pratinjau: Produk dengan kode ' + code + ' diklik untuk membuka modal detail');
        }}
      />

    </div>
  );
}
