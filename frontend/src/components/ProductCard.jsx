import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, Eye } from 'lucide-react';
import { getProductImageSrc, getProductPlaceholderSrc, getBrandTheme } from '../utils/productUtils';

export default function ProductCard({ product, currentStore, onOpenDetail }) {
  const [imgError, setImgError] = useState(false);
  const theme = getBrandTheme(product.brand);

  const fallbackUrl = getProductPlaceholderSrc(
    product.brand,
    product.category,
    product.item_code
  );

  const imgSrc = imgError ? fallbackUrl : getProductImageSrc(product);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col overflow-hidden group">
      
      {/* Image Container with Badges */}
      <div className="relative aspect-[4/3] bg-slate-50 flex items-center justify-center p-3 overflow-hidden border-b border-slate-100">
        
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border shadow-xs ${theme.tag}`}>
            {product.brand}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/90 text-slate-600 border border-slate-200/80 backdrop-blur-xs truncate max-w-[150px]">
            {product.category}
          </span>
        </div>

        {/* Product Image */}
        <img
          src={imgSrc}
          alt={product.official_name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-sky-800 transition-colors"
            title={product.official_name}
          >
            {product.official_name}
          </h3>

          {/* Code & SKU */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
            <span>Kode: <strong className="text-slate-800">{product.item_code}</strong></span>
            <span>SKU: <strong className="text-slate-800 truncate max-w-[100px] inline-block align-bottom">{product.official_sku || '-'}</strong></span>
          </div>

          {/* Real-time Stock Badge */}
          {currentStore ? (
            product.outletStock > 0 ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tersedia di Toko Anda: <strong>{product.outletStock} Pcs</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold mb-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Stok Toko: <strong>Kosong (0 Pcs)</strong></span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium mb-3">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Total Jaringan: <strong>{product.totalNetworkStock || 0} Pcs</strong></span>
            </div>
          )}

          {/* Main Specification Highlight */}
          <div className="text-xs text-slate-600 line-clamp-2 mb-4 bg-sky-50/40 p-2 rounded-lg border border-sky-100/60">
            <strong className="text-sky-900">Spesifikasi:</strong> {product.main_spec || '-'}
          </div>
        </div>

        {/* Card Footer: Barcode & Detail Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
            {product.barcode || '-'}
          </span>
          <button
            onClick={() => onOpenDetail(product.item_code)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:text-sky-700 text-slate-700 text-xs font-bold transition shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detail 17 Kolom</span>
          </button>
        </div>

      </div>

    </div>
  );
}
