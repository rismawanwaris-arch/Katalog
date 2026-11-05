import React, { useState, useEffect } from 'react';
import { 
  X, Camera, Trash2, Star, ArrowLeft, ArrowRight, Plus, 
  Upload, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, Link as LinkIcon 
} from 'lucide-react';
import { getProductPlaceholderSrc, getBrandTheme } from '../../utils/productUtils';

export default function ProductGalleryModal({
  isOpen,
  onClose,
  product,
  adminToken,
  onGalleryUpdated
}) {
  const [images, setImages] = useState([]);
  const [primaryImage, setPrimaryImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync internal state when product changes or modal opens
  useEffect(() => {
    if (product) {
      const gallery = Array.isArray(product.gallery_images) && product.gallery_images.length > 0
        ? product.gallery_images
        : (product.image_url ? [product.image_url] : []);
      
      setImages(gallery);
      setPrimaryImage(product.image_url || gallery[0] || '');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const theme = getBrandTheme(product.brand);
  const fallbackUrl = getProductPlaceholderSrc(product.brand, product.category, product.item_code);

  function notifyUpdated(newGallery, newPrimary) {
    setImages(newGallery);
    setPrimaryImage(newPrimary);
    if (onGalleryUpdated) {
      onGalleryUpdated({
        ...product,
        image_url: newPrimary,
        gallery_images: newGallery
      });
    }
  }

  // Handle uploading multiple files from device
  async function handleMultiFileUpload(fileList) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const validFiles = files.filter(f => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      alert('Pilih file gambar yang valid (JPG, PNG, WebP, GIF)');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Convert all files to Base64 in parallel
      const payloadImages = await Promise.all(
        validFiles.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ imageBase64: reader.result, fileName: file.name });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.item_code)}/gallery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ images: payloadImages })
      });

      const data = await res.json();
      if (data.success) {
        notifyUpdated(data.gallery_images, data.primaryImage);
        setSuccessMsg(`Berhasil menambahkan ${validFiles.length} foto ke galeri!`);
      } else {
        setErrorMsg(data.message || 'Gagal mengunggah foto');
      }
    } catch (err) {
      setErrorMsg('Kesalahan jaringan saat mengunggah foto: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  // Handle adding photo via URL
  async function handleAddUrl() {
    const url = urlInput.trim();
    if (!url) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.item_code)}/gallery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ imageUrl: url })
      });

      const data = await res.json();
      if (data.success) {
        notifyUpdated(data.gallery_images, data.primaryImage);
        setUrlInput('');
        setShowUrlInput(false);
        setSuccessMsg('URL foto berhasil ditambahkan ke galeri!');
      } else {
        setErrorMsg(data.message || 'Gagal menambahkan URL');
      }
    } catch (err) {
      setErrorMsg('Kesalahan: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Handle setting an image as primary / cover
  async function handleSetPrimary(imageUrl) {
    if (imageUrl === primaryImage) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.item_code)}/gallery/primary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ imageUrl })
      });

      const data = await res.json();
      if (data.success) {
        notifyUpdated(data.gallery_images, data.primaryImage);
        setSuccessMsg('Foto utama berhasil diubah!');
      } else {
        setErrorMsg(data.message || 'Gagal mengatur foto utama');
      }
    } catch (err) {
      setErrorMsg('Kesalahan: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Handle deleting an image from gallery
  async function handleDeleteImage(imageUrl) {
    if (!confirm('Hapus foto ini dari galeri produk?')) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.item_code)}/gallery`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ imageUrl })
      });

      const data = await res.json();
      if (data.success) {
        notifyUpdated(data.gallery_images, data.primaryImage);
        setSuccessMsg('Foto berhasil dihapus dari galeri.');
      } else {
        setErrorMsg(data.message || 'Gagal menghapus foto');
      }
    } catch (err) {
      setErrorMsg('Kesalahan: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Handle moving image position (reordering)
  async function handleMovePosition(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= images.length) return;

    const newImages = [...images];
    const item = newImages.splice(fromIndex, 1)[0];
    newImages.splice(toIndex, 0, item);

    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.item_code)}/gallery/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken
        },
        body: JSON.stringify({ images: newImages })
      });

      const data = await res.json();
      if (data.success) {
        notifyUpdated(data.gallery_images, data.primaryImage);
      } else {
        setErrorMsg(data.message || 'Gagal memindahkan posisi foto');
      }
    } catch (err) {
      setErrorMsg('Kesalahan: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-fast">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-modal-in">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.tag}`}>
                  {product.brand}
                </span>
                <span className="text-xs font-mono font-bold text-sky-900">
                  {product.item_code}
                </span>
                <span className="text-xs text-slate-400">
                  • {images.length} Foto Terdaftar
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-1">
                {product.official_name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition hover:rotate-90"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Upload Area: Multi File Drop / Select */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-sky-400 transition-colors">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
                {uploading ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-800 mb-1">
                {uploading ? 'Sedang Mengunggah Foto...' : 'Tambah Foto Lebih dari 1 (Multiple Upload)'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mb-4">
                Pilih satu atau sekaligus banyak file foto dari perangkat Anda (bisa memilih banyak file sekaligus dengan tombol Ctrl/Shift). Format didukung: JPG, PNG, WebP.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs">
                  <Camera className="w-4 h-4" />
                  <span>{uploading ? 'Mengunggah...' : 'Pilih Foto dari Perangkat (Bisa Banyak)'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploading || actionLoading}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleMultiFileUpload(e.target.files);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tambah via Link / URL</span>
                </button>
              </div>

              {/* Paste URL Input Drawer */}
              {showUrlInput && (
                <div className="mt-4 pt-4 border-t border-slate-200 w-full max-w-lg flex items-center gap-2 animate-fade-fast">
                  <input
                    type="url"
                    placeholder="Tempel URL gambar (https://...)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddUrl();
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={actionLoading || !urlInput.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50"
                  >
                    Tambah
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Gallery Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span>Daftar Foto Produk ({images.length} Foto)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Foto di posisi pertama otomatis menjadi cover katalog
              </span>
            </div>

            {images.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-400">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
                <p className="text-xs font-bold text-slate-700">Belum ada foto yang diunggah</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gunakan tombol di atas untuk mengunggah foto produk pertama Anda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((imgUrl, idx) => {
                  const isPrimary = idx === 0 || imgUrl === primaryImage;

                  return (
                    <div
                      key={imgUrl + idx}
                      className={`relative group bg-white rounded-2xl border-2 transition-all p-2 flex flex-col shadow-xs ${
                        isPrimary
                          ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20'
                          : 'border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="aspect-square rounded-xl bg-slate-50 p-2 flex items-center justify-center overflow-hidden mb-2 relative">
                        <img
                          src={imgUrl}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.src = fallbackUrl; }}
                        />

                        {/* Primary Badge */}
                        {isPrimary ? (
                          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            <span>UTAMA</span>
                          </span>
                        ) : (
                          <span className="absolute top-1.5 left-1.5 bg-slate-900/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                            #{idx + 1}
                          </span>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(imgUrl)}
                          disabled={actionLoading}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Hapus foto ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Card Action Controls */}
                      <div className="flex items-center justify-between gap-1 pt-1 mt-auto border-t border-slate-100">
                        {/* Position Move Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMovePosition(idx, idx - 1)}
                            disabled={idx === 0 || actionLoading}
                            className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-sky-700 hover:border-sky-400 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Geser ke kiri / urutan sebelumnya"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePosition(idx, idx + 1)}
                            disabled={idx === images.length - 1 || actionLoading}
                            className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-sky-700 hover:border-sky-400 disabled:opacity-30 disabled:pointer-events-none transition"
                            title="Geser ke kanan / urutan selanjutnya"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Set Primary Button */}
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(imgUrl)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 transition"
                            title="Jadikan sebagai foto cover utama"
                          >
                            <Star className="w-3 h-3 text-amber-600" />
                            <span>Jadikan Cover</span>
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {images.length > 0
              ? `Tersimpan ${images.length} foto untuk produk ini.`
              : 'Belum ada foto yang disimpan.'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-800 transition"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
