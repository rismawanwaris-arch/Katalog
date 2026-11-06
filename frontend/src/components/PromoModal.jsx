import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  Tag, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  ShoppingBag, 
  Eye, 
  Package 
} from 'lucide-react';

export default function PromoModal({
  isOpen,
  onClose,
  promo,
  onActionClick,
  onSelectProduct,
  currentStore
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen || !promo || !promo.enabled) return null;

  function handleClose() {
    if (dontShowAgain) {
      const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      localStorage.setItem('katalog_promo_dismissed_date', todayStr);
    }
    onClose();
  }

  function handleAction() {
    if (dontShowAgain) {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('katalog_promo_dismissed_date', todayStr);
    }
    if (onActionClick) {
      onActionClick(promo);
    }
    onClose();
  }

  function handleProductClick(itemCode) {
    if (dontShowAgain) {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('katalog_promo_dismissed_date', todayStr);
    }
    onClose();
    if (onSelectProduct) {
      onSelectProduct(itemCode);
    }
  }

  function formatRp(val) {
    const num = Number(val) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
  }

  const hasProducts = Array.isArray(promo.products) && promo.products.length > 0;
  const showBannerImage = Boolean(promo.imageUrl && (promo.mode === 'banner' || promo.mode === 'both'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity animate-fade-fast"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl sm:max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all transform animate-scale-up my-auto max-h-[92vh] flex flex-col">
        
        {/* Floating Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white backdrop-blur-md flex items-center justify-center transition shadow-lg active:scale-95"
          title="Tutup Promo (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">

          {/* Banner Image (if available & enabled) */}
          {showBannerImage ? (
            <div className="relative w-full bg-slate-950 max-h-[300px] overflow-hidden flex items-center justify-center">
              <img 
                src={promo.imageUrl} 
                alt={promo.title || 'Promo Banner'} 
                className="w-full h-full object-contain max-h-[300px] select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            /* Gradient Header */
            <div className="relative w-full p-5 sm:p-6 bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-900 text-white overflow-hidden">
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-sky-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-black tracking-wider uppercase mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {promo.badge || 'PROMO SPESIAL'}
                </span>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-1.5 text-white">
                  {promo.title || 'PROMO AKSESORIS PILIHAN'}
                </h2>

                <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed max-w-lg">
                  {promo.subtitle || 'Dapatkan penawaran harga spesial untuk produk pilihan original bergaransi resmi di cabang kami.'}
                </p>
              </div>
            </div>
          )}

          {/* Text Title & Subtitle (shown if banner image was displayed above) */}
          {showBannerImage && (
            <div className="p-5 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {promo.badge || 'Promo Pilihan'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                {promo.title || 'Promo Hari Ini'}
              </h3>
              {promo.subtitle && (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {promo.subtitle}
                </p>
              )}
            </div>
          )}

          {/* FEATURED PROMO PRODUCTS SECTION */}
          {hasProducts && (
            <div className="p-4 sm:p-5 pt-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
                  Produk Pilihan Promo:
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {promo.products.length} produk pilihan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {promo.products.map(item => {
                  const hasPromoPrice = item.promo_price > 0 && item.promo_price < item.price;
                  return (
                    <div
                      key={item.item_code}
                      onClick={() => handleProductClick(item.item_code)}
                      className="group relative bg-slate-50 hover:bg-sky-50/60 rounded-2xl border border-slate-200/80 hover:border-sky-300 p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
                    >
                      {/* Badge Promo */}
                      {item.promo_badge && (
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[10px] shadow-sm tracking-wide uppercase">
                            {item.promo_badge}
                          </span>
                        </div>
                      )}

                      <div>
                        {/* Image Thumbnail */}
                        <div className="w-full aspect-square bg-white rounded-xl border border-slate-100 overflow-hidden mb-2.5 flex items-center justify-center p-2 group-hover:scale-[1.02] transition">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.official_name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-slate-300" />
                          )}
                        </div>

                        {/* Brand & Name */}
                        <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                          {item.brand}
                        </span>
                        <h5 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-sky-900 transition">
                          {item.official_name}
                        </h5>
                      </div>

                      {/* Pricing & Stock */}
                      <div className="pt-2 mt-2 border-t border-slate-200/60">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          {hasPromoPrice ? (
                            <>
                              <span className="text-xs sm:text-sm font-black text-emerald-700">
                                {formatRp(item.promo_price)}
                              </span>
                              <span className="text-[11px] text-slate-400 line-through">
                                {formatRp(item.price)}
                              </span>
                            </>
                          ) : item.price > 0 ? (
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              {formatRp(item.price)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Hubungi Toko
                            </span>
                          )}
                        </div>

                        {/* Quick Stock Indicator */}
                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          {item.outletStock > 0 ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Ready {item.outletStock} pcs
                            </span>
                          ) : item.totalNetworkStock > 0 ? (
                            <span className="text-slate-500 font-medium">
                              Ada di cabang ({item.totalNetworkStock})
                            </span>
                          ) : (
                            <span className="text-slate-400">Cek stok</span>
                          )}

                          <span className="text-sky-600 font-bold group-hover:underline flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> Detail
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions & Don't Show Again */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAction}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-700 to-sky-600 hover:from-sky-800 hover:to-sky-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-md shadow-sky-700/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <span>{promo.actionText || 'Mulai Belanja & Cek Stok'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs sm:text-sm transition"
            >
              Tutup
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-500 hover:text-slate-700 self-center">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <span>Jangan tampilkan promo ini lagi hari ini</span>
          </label>
        </div>

      </div>
    </div>
  );
}
