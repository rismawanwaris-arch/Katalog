import React, { useState } from 'react';
import { X, ExternalLink, CheckCircle2, AlertCircle, Store, ShieldCheck } from 'lucide-react';
import { getProductImageSrc, getProductPlaceholderSrc, getBrandTheme } from '../utils/productUtils';

export default function ProductDetailModal({ isOpen, onClose, product, currentStore }) {
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !product) return null;

  const theme = getBrandTheme(product.brand);
  const fallbackUrl = getProductPlaceholderSrc(product.brand, product.category, product.item_code);
  const imgSrc = imgError ? fallbackUrl : getProductImageSrc(product);

  const columnsData = [
    { label: '1. No & Kode Item', value: `${product.item_no || '-'} | ${product.item_code}` },
    { label: '2. Nama Item (ERP / POS)', value: product.item_name || '-' },
    { label: '3. Item Alias', value: product.item_alias || '-' },
    { label: '4. Barcode / EAN', value: product.barcode || '-' },
    { label: '5. Merk / Brand', value: product.brand || '-' },
    { label: '6. Kategori Produk', value: product.category || '-' },
    { label: '7. SKU / Model Resmi', value: product.official_sku || '-' },
    { label: '8. Nama Produk Lengkap (Official)', value: product.official_name || '-' },
    { label: '9. Spesifikasi Utama', value: product.main_spec || '-' },
    { label: '10. Spesifikasi Detail & Fitur', value: product.detail_spec || '-' },
    { label: '11. Konektor / Interface', value: product.interface || '-' },
    { label: '12. Kompatibilitas Perangkat / OS', value: product.compatibility || '-' },
    { label: '13. Warna / Varian', value: product.color || '-' },
    {
      label: '14. Foto Produk (URL HD)',
      value: product.image_url ? (
        <a href={product.image_url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline flex items-center gap-1">
          Buka Gambar HD <ExternalLink className="w-3 h-3" />
        </a>
      ) : '-'
    },
    {
      label: '15. Toko Resmi / Official Store',
      value: product.official_store_url ? (
        <a href={product.official_store_url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline flex items-center gap-1">
          Kunjungi Official Store <ExternalLink className="w-3 h-3" />
        </a>
      ) : '-'
    },
    { label: '16. Status Data', value: product.status_data || 'Lengkap' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase border ${theme.tag}`}>
                {product.brand}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-200/80 text-slate-700">
                {product.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Data Resmi Terverifikasi
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
              {product.official_name}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              SKU: {product.official_sku || '-'} | Kode ERP: {product.item_code} | Barcode: {product.barcode || '-'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: Image & Outlet Stock Card */}
            <div className="md:col-span-5 flex flex-col gap-4">
              
              {/* Product Image */}
              <div className="aspect-square bg-slate-50 rounded-xl border border-slate-200/80 p-4 flex items-center justify-center overflow-hidden">
                <img
                  src={imgSrc}
                  alt={product.official_name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Outlet Stock Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Store className="w-4 h-4 text-sky-700" />
                  <span>Ketersediaan di Toko Anda</span>
                </div>
                
                {currentStore ? (
                  product.outletStock > 0 ? (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Ready di Toko: {currentStore}</span>
                      </div>
                      <p className="text-2xl font-black text-emerald-700 mt-1">
                        {product.outletStock} <span className="text-xs font-normal text-emerald-800">Pcs</span>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span>Stok Kosong di {currentStore}</span>
                      </div>
                      <p className="text-xs text-rose-700 mt-1">
                        Barang saat ini tidak tersedia di toko yang Anda jaga.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    Pilih toko Anda di tombol navigasi atas untuk melihat jumlah stok di toko Anda.
                  </div>
                )}

                {/* Network Stock Summary */}
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Total Stok Seluruh 43 Cabang:</span>
                  <strong className="text-slate-900 text-sm font-bold">
                    {product.totalNetworkStock || 0} Pcs
                  </strong>
                </div>
              </div>

            </div>

            {/* Right Column: 17 Kolom Spesifikasi & Breakdown */}
            <div className="md:col-span-7 space-y-4">
              
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Spesifikasi Resmi 17 Kolom Excel
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {columnsData.map((col, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-2.5 sm:p-3 hover:bg-slate-50/50 transition">
                    <span className="col-span-5 font-semibold text-slate-600 pr-2">
                      {col.label}
                    </span>
                    <span className="col-span-7 text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                      {col.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Outlet Breakdown List */}
              {product.allOutletsBreakdown && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    17. Stok Cabang Lainnya (Yang Memiliki Stok)
                  </h4>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/40 text-xs grid grid-cols-2 gap-1.5">
                    {product.allOutletsBreakdown
                      .filter(b => b.stock > 0)
                      .map(b => (
                        <div
                          key={b.outlet}
                          className={`flex items-center justify-between p-1.5 rounded-lg border ${
                            b.outlet === currentStore
                              ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="truncate pr-1">{b.outlet}</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold shrink-0">
                            {b.stock} Pcs
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-800 transition"
          >
            Tutup Detail
          </button>
        </div>

      </div>
    </div>
  );
}
