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
  Link as LinkIcon 
} from 'lucide-react';
import PromoModal from '../PromoModal';

export default function PromoManager({ adminToken }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionText, setActionText] = useState('Mulai Belanja & Cek Stok');
  const [actionFilter, setActionFilter] = useState('');

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
        setTitle(data.promo.title || '');
        setSubtitle(data.promo.subtitle || '');
        setImageUrl(data.promo.imageUrl || '');
        setActionText(data.promo.actionText || 'Mulai Belanja & Cek Stok');
        setActionFilter(data.promo.actionFilter || '');
      }
    } catch (err) {
      console.error('Error fetching promo:', err);
      setMessage({ type: 'error', text: 'Gagal memuat pengaturan promo: ' + err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/promo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({
          enabled,
          title,
          subtitle,
          imageUrl,
          actionText,
          actionFilter
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Pengaturan poster promo popup berhasil disimpan!' });
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
    title: title || 'PROMO SPESIAL HARI INI',
    subtitle: subtitle || 'Temukan aksesoris gadget original dengan penawaran terbaik di 43 cabang kami!',
    imageUrl,
    actionText: actionText || 'Mulai Belanja & Cek Stok',
    actionFilter
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
              Poster &amp; Promo Popup Halaman Awal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Atur banner poster promosi yang muncul otomatis saat pengunjung membuka website katalog.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Pratinjau (Preview)</span>
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-md shadow-sky-700/20 transition disabled:opacity-50"
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

      {/* Form Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
            
            {/* Toggle Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Status Promo Popup</span>
                <span className="text-[11px] text-slate-500">
                  {enabled ? 'Popup aktif dan akan muncul saat pengunjung membuka website.' : 'Popup dinonaktifkan (tidak akan muncul).'}
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

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Judul Promo (Headline)
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: PROMO SPESIAL HARI INI / DISKON SPESIAL BULAN INI"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-semibold text-slate-800"
              />
            </div>

            {/* Subtitle Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Subjudul / Deskripsi Promo
              </label>
              <textarea
                rows={3}
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Tuliskan keterangan promo atau pesan untuk pelanggan..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700 resize-none"
              />
            </div>

            {/* Action Button Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Teks Tombol Aksi
                </label>
                <input
                  type="text"
                  value={actionText}
                  onChange={e => setActionText(e.target.value)}
                  placeholder="Contoh: Mulai Belanja & Cek Stok"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Filter Otomatis Saat Diklik (Opsional)
                </label>
                <input
                  type="text"
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                  placeholder="Contoh kata kunci: Kabel Data / REXI / Charger"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 text-slate-800"
                />
              </div>
            </div>

            {/* External URL Input */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Atau Masukkan URL Gambar Poster Eksternal
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://... atau /images/promo/..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 text-slate-700"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Poster Image Upload & Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <span className="text-xs font-bold text-slate-800 block uppercase tracking-wider">
              File Poster / Banner Promo
            </span>

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
                      className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold flex items-center gap-1 shadow"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Image className="w-10 h-10 stroke-[1.5] mb-2" />
                  <span className="text-xs font-bold text-slate-600 mb-1">Belum Ada Gambar Poster</span>
                  <p className="text-[11px] text-slate-400 max-w-[200px]">
                    Jika kosong, sistem akan otomatis menggunakan template banner biru default.
                  </p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <label className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-sky-700" />
                <span>Upload Poster Gambar Baru</span>
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
                className="w-full py-2 text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold text-center"
              >
                Gunakan Desain Gradient Bawaan (Hapus Gambar)
              </button>
            )}

          </div>
        </div>

      </div>

      {/* Preview Modal */}
      <PromoModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        promo={previewPromoData}
        onActionClick={() => {
          alert('Pratinjau: Tombol aksi diklik dengan filter "' + (actionFilter || 'Semua') + '"');
        }}
      />

    </div>
  );
}
