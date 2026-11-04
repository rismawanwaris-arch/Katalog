import React, { useState } from 'react';
import { X, ArrowLeftRight, CheckCircle2, AlertCircle, Store, Eye, Trash2, Sparkles, Plus, ExternalLink } from 'lucide-react';
import { getProductImageSrc, getProductPlaceholderSrc, getBrandTheme, formatRupiah } from '../utils/productUtils';

export default function ProductCompareModal({
  isOpen,
  onClose,
  comparedProducts = [],
  onRemoveProduct,
  onClearAll,
  currentStore,
  onOpenDetail
}) {
  const [highlightDiff, setHighlightDiff] = useState(true);

  if (!isOpen) return null;

  // Helper to determine if a field has different values among the compared products
  function hasDifference(accessor) {
    if (comparedProducts.length < 2) return false;
    const firstVal = String(accessor(comparedProducts[0]) || '').trim().toLowerCase();
    return comparedProducts.some(p => String(accessor(p) || '').trim().toLowerCase() !== firstVal);
  }

  const specRows = [
    {
      title: 'Harga Jual Retail',
      accessor: p => (p.price > 0 ? formatRupiah(p.price) : 'Hubungi Toko'),
      customRender: p => (
        <div className="flex flex-col items-center">
          <span className="text-base sm:text-lg font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            {p.price > 0 ? formatRupiah(p.price) : 'Hubungi Toko'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {p.price > 0 ? 'Harga Retail' : 'Belum Ada Harga'}
          </span>
        </div>
      )
    },
    {
      title: 'Ketersediaan Stok',
      accessor: p => `${p.outletStock || 0}-${p.totalNetworkStock || 0}`,
      customRender: p => (
        <div className="space-y-1.5 text-center">
          {currentStore ? (
            p.outletStock > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {p.outletStock} Pcs di {currentStore}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Kosong di {currentStore}
              </span>
            )
          ) : null}
          <div className="text-[11px] text-slate-500">
            Total Jaringan: <strong className="text-slate-800">{p.totalNetworkStock || 0} Pcs</strong>
          </div>
        </div>
      )
    },
    {
      title: 'Merk / Brand',
      accessor: p => p.brand,
      customRender: p => {
        const theme = getBrandTheme(p.brand);
        return (
          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase border shadow-2xs ${theme.tag}`}>
            {p.brand}
          </span>
        );
      }
    },
    {
      title: 'Kategori Produk',
      accessor: p => p.category,
      customRender: p => <span className="text-xs font-medium text-slate-800">{p.category}</span>
    },
    {
      title: 'Spesifikasi Utama',
      accessor: p => p.main_spec || '-',
      customRender: p => (
        <div className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          {p.main_spec || '-'}
        </div>
      )
    },
    {
      title: 'Konektor / Interface',
      accessor: p => p.interface || '-',
      customRender: p => <span className="text-xs font-semibold text-sky-900">{p.interface || '-'}</span>
    },
    {
      title: 'Kompatibilitas',
      accessor: p => p.compatibility || '-',
      customRender: p => <span className="text-xs text-slate-700">{p.compatibility || '-'}</span>
    },
    {
      title: 'Warna / Varian',
      accessor: p => p.color || '-',
      customRender: p => <span className="text-xs text-slate-700">{p.color || '-'}</span>
    },
    {
      title: 'Fitur & Spesifikasi Detail',
      accessor: p => p.detail_spec || '-',
      customRender: p => (
        <div className="text-xs text-slate-600 leading-relaxed max-h-40 overflow-y-auto text-left bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
          {p.detail_spec || '-'}
        </div>
      )
    },
    {
      title: 'Barcode / EAN',
      accessor: p => p.barcode || '-',
      customRender: p => <span className="text-xs font-mono text-slate-500">{p.barcode || '-'}</span>
    },
    {
      title: 'Toko Resmi',
      accessor: p => (p.official_store_url ? 'Ada' : '-'),
      customRender: p => (
        p.official_store_url ? (
          <a
            href={p.official_store_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-semibold underline"
          >
            <span>Kunjungi Store</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-fast">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-100 animate-modal-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Perbandingan Produk Aksesoris</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  {comparedProducts.length} Produk
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Bandingkan spesifikasi teknis, harga retail, dan ketersediaan stok side-by-side
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Toggle Highlight Differences */}
            {comparedProducts.length > 1 && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer shadow-2xs hover:bg-slate-50 transition select-none">
                <input
                  type="checkbox"
                  checked={highlightDiff}
                  onChange={e => setHighlightDiff(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                />
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Sorot Perbedaan</span>
              </label>
            )}

            {/* Clear All */}
            {comparedProducts.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 text-xs font-bold transition shadow-2xs"
                title="Hapus semua produk dari daftar komparasi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus Semua</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition hover:rotate-90"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Table Scroll Container */}
        <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1">
          {comparedProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-40 text-sky-600" />
              <h3 className="text-base font-bold text-slate-700 mb-1">
                Belum ada produk yang dipilih
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Pilih 2 hingga 4 produk dari katalog dengan menekan tombol "Bandingkan" pada kartu produk.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                Kembali ke Katalog
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-44 min-w-[160px] p-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70 border-b border-slate-200 sticky left-0 z-20 backdrop-blur-xs">
                    Parameter
                  </th>
                  {comparedProducts.map(product => {
                    const fallbackUrl = getProductPlaceholderSrc(product.brand, product.category, product.item_code);
                    const rawSrc = getProductImageSrc(product);
                    const imgSrc = rawSrc || fallbackUrl;

                    return (
                      <th
                        key={product.item_code}
                        className="w-72 min-w-[260px] max-w-[320px] p-3.5 text-center bg-white border-b border-l border-slate-200 align-top"
                      >
                        <div className="flex flex-col items-center relative group">
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => onRemoveProduct(product.item_code)}
                            className="absolute -top-1 -right-1 p-1 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition shadow-2xs cursor-pointer"
                            title="Hapus dari perbandingan"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Product Image */}
                          <div className="w-24 h-24 aspect-square bg-slate-50 rounded-xl border border-slate-200/80 p-2 flex items-center justify-center overflow-hidden mb-2">
                            <img
                              src={imgSrc}
                              alt={product.official_name}
                              className="w-full h-full object-contain"
                              onError={e => { e.currentTarget.src = fallbackUrl; }}
                            />
                          </div>

                          {/* Product Title */}
                          <h4
                            className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-1 hover:text-sky-700 cursor-pointer"
                            onClick={() => onOpenDetail(product.item_code)}
                            title={product.official_name}
                          >
                            {product.official_name}
                          </h4>

                          {/* Code & SKU */}
                          <div className="text-[11px] text-slate-500 font-mono mb-2">
                            <span>Kode: <strong className="text-slate-800">{product.item_code}</strong></span>
                            {product.official_sku && (
                              <span className="ml-1 text-slate-400">({product.official_sku})</span>
                            )}
                          </div>

                          {/* View Detail Button */}
                          <button
                            type="button"
                            onClick={() => onOpenDetail(product.item_code)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-sky-500 hover:text-sky-700 text-slate-700 text-[11px] font-bold transition shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat Detail</span>
                          </button>
                        </div>
                      </th>
                    );
                  })}

                  {/* Empty Slot Card if less than 4 products */}
                  {comparedProducts.length < 4 && (
                    <th className="w-64 min-w-[220px] p-4 text-center bg-slate-50/50 border-b border-l border-dashed border-slate-300 align-middle">
                      <div className="py-6 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-2 text-slate-400">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 mb-0.5">Tambah Produk</span>
                        <p className="text-[11px] text-slate-400 max-w-[180px] leading-tight">
                          Pilih produk lain di katalog untuk perbandingan hingga 4 produk
                        </p>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {specRows.map((row, idx) => {
                  const isDiff = hasDifference(row.accessor);
                  const highlight = highlightDiff && isDiff;

                  return (
                    <tr
                      key={row.title}
                      className={`transition-colors ${
                        highlight
                          ? 'bg-amber-50/50 hover:bg-amber-50'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-slate-50/50'
                          : 'bg-slate-50/30 hover:bg-slate-50'
                      }`}
                    >
                      {/* Row Title */}
                      <td className="p-3 text-xs font-bold text-slate-700 border-b border-slate-200 sticky left-0 z-10 bg-inherit backdrop-blur-xs">
                        <div className="flex items-center gap-1.5">
                          {highlight && (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                              title="Terdapat perbedaan spesifikasi"
                            ></span>
                          )}
                          <span>{row.title}</span>
                        </div>
                      </td>

                      {/* Product Value Cells */}
                      {comparedProducts.map(product => (
                        <td
                          key={product.item_code}
                          className="p-3 text-center border-b border-l border-slate-200 align-middle"
                        >
                          {row.customRender ? row.customRender(product) : row.accessor(product)}
                        </td>
                      ))}

                      {/* Empty Slot cell */}
                      {comparedProducts.length < 4 && (
                        <td className="p-3 border-b border-l border-dashed border-slate-200 text-center text-slate-300 bg-slate-50/20">
                          -
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {comparedProducts.length >= 2 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Siap membandingkan {comparedProducts.length} produk
              </span>
            ) : (
              <span>Pilih minimal 2 produk untuk komparasi optimal.</span>
            )}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
