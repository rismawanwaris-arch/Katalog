import React from 'react';
import { ArrowLeftRight, X, Trash2, Check } from 'lucide-react';
import { getProductImageSrc, getProductPlaceholderSrc } from '../utils/productUtils';

export default function CompareFloatingBar({
  comparedProducts = [],
  onOpenCompare,
  onRemoveProduct,
  onClearAll
}) {
  if (comparedProducts.length === 0) return null;

  const canCompare = comparedProducts.length >= 2;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-slate-700/70 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-fast">
      
      {/* Product Thumbnails */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto py-0.5">
        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div className="hidden xs:block">
            <span className="text-[11px] font-bold text-slate-300 block leading-tight">
              Bandingkan ({comparedProducts.length}/4)
            </span>
            <span className="text-[9px] text-slate-400 block leading-tight">
              {canCompare ? 'Siap dibandingkan' : 'Pilih min. 2'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {comparedProducts.map(p => {
            const fallbackUrl = getProductPlaceholderSrc(p.brand, p.category, p.item_code);
            const rawSrc = getProductImageSrc(p);
            const imgSrc = rawSrc || fallbackUrl;

            return (
              <div
                key={p.item_code}
                className="relative group shrink-0 w-11 h-11 rounded-xl bg-white/10 p-1 border border-white/20 flex items-center justify-center"
                title={`${p.official_name} (${p.item_code})`}
              >
                <img
                  src={imgSrc}
                  alt={p.official_name}
                  className="w-full h-full object-contain rounded-lg"
                  onError={e => { e.currentTarget.src = fallbackUrl; }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveProduct(p.item_code);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-90 hover:opacity-100 hover:scale-110 transition shadow-xs cursor-pointer"
                  title="Hapus dari daftar perbandingan"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Placeholders for remaining slots */}
          {[...Array(Math.max(0, 4 - comparedProducts.length))].map((_, i) => (
            <div
              key={i}
              className="w-11 h-11 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-[10px] font-bold shrink-0"
              title="Slot kosong"
            >
              +{i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg transition"
          title="Kosongkan daftar perbandingan"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onOpenCompare}
          disabled={!canCompare}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer ${
            canCompare
              ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/30 animate-pulse'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>{canCompare ? 'Bandingkan Sekarang' : 'Pilih 1 Produk Lagi'}</span>
        </button>
      </div>

    </div>
  );
}
