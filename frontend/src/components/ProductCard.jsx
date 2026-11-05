import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, Eye, ArrowLeftRight, Images } from 'lucide-react';
import { getProductImageSrc, getProductPlaceholderSrc, getBrandTheme, formatRupiah } from '../utils/productUtils';

function LazyProductImage({ src, fallbackUrl, alt }) {
  const [inView, setInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '150px' } // Load 150px before scrolled into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const isDataUri = src && src.startsWith('data:');
  const shouldLoadActual = inView || isDataUri;
  const currentSrc = hasError ? fallbackUrl : (shouldLoadActual ? src : fallbackUrl);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-contain transition-all duration-300 group-hover:scale-105 ${
          !isLoaded && shouldLoadActual && !isDataUri ? 'opacity-70 blur-[1px]' : 'opacity-100 blur-0'
        }`}
      />
    </div>
  );
}

export default function ProductCard({
  product,
  currentStore,
  onOpenDetail,
  isCompared = false,
  onToggleCompare
}) {
  const theme = getBrandTheme(product.brand);

  const fallbackUrl = getProductPlaceholderSrc(
    product.brand,
    product.category,
    product.item_code
  );

  const rawSrc = getProductImageSrc(product);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-slate-200/70 hover:border-sky-300 hover:-translate-y-1 transition-all duration-200 ease-out flex flex-col overflow-hidden group will-change-transform">
      
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

        {/* On-Demand Lazy Loaded & Cached Product Image */}
        <LazyProductImage
          src={rawSrc}
          fallbackUrl={fallbackUrl}
          alt={product.official_name}
        />

        {/* Multi-Photo Gallery Badge */}
        {Array.isArray(product.gallery_images) && product.gallery_images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-sm z-10 pointer-events-none">
            <Images className="w-3 h-3 text-sky-400" />
            <span>{product.gallery_images.length} Foto</span>
          </div>
        )}
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
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
            <span>Kode: <strong className="text-slate-800">{product.item_code}</strong></span>
            <span>SKU: <strong className="text-slate-800 truncate max-w-[100px] inline-block align-bottom">{product.official_sku || '-'}</strong></span>
          </div>

          {/* Price Tag */}
          <div className="mb-3 flex items-baseline justify-between bg-emerald-50/50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
            <span className="text-sm sm:text-base font-black text-emerald-700 tracking-tight">
              {product.price > 0 ? formatRupiah(product.price) : 'Hubungi Toko'}
            </span>
            <span className="text-[10px] text-emerald-800/70 font-semibold uppercase tracking-wider">
              {product.price > 0 ? 'Harga Retail' : 'Belum Ada Harga'}
            </span>
          </div>

          {/* Current Store Stock Indicator */}
          {currentStore ? (
            product.outletStock > 0 ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Tersedia di Toko Anda: <strong>{product.outletStock} Pcs</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold mb-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  Stok Toko: <strong>Kosong (0 Pcs)</strong>
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold mb-3">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Total Jaringan: <strong>{product.totalNetworkStock || 0} Pcs</strong>
              </span>
            </div>
          )}

          {/* Quick Spec Snippet */}
          <div className="text-xs text-slate-600 line-clamp-2 mb-4 bg-sky-50/40 p-2 rounded-lg border border-sky-100/60">
            <strong className="text-sky-900">Spesifikasi:</strong> {product.main_spec || '-'}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-auto">
          <button
            type="button"
            onClick={() => onToggleCompare && onToggleCompare(product)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
              isCompared
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border-slate-200 hover:border-sky-300'
            }`}
            title={isCompared ? 'Hapus dari perbandingan' : 'Tambah ke perbandingan produk'}
          >
            <ArrowLeftRight className={`w-3.5 h-3.5 ${isCompared ? 'text-white' : 'text-slate-500'}`} />
            <span>{isCompared ? 'Dibandingkan' : 'Bandingkan'}</span>
          </button>

          <button
            onClick={() => onOpenDetail(product.item_code)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:text-sky-700 hover:bg-sky-50/50 active:scale-95 text-slate-700 text-xs font-bold transition-all duration-150 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detail</span>
          </button>
        </div>

      </div>

    </div>
  );
}
