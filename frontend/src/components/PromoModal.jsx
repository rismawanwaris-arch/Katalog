import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, Tag, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function PromoModal({
  isOpen,
  onClose,
  promo,
  onActionClick
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm transition-opacity animate-fade-fast"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg sm:max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all transform animate-scale-up my-auto">
        
        {/* Floating Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition shadow-lg active:scale-95"
          title="Tutup Promo (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Poster / Banner Header */}
        {promo.imageUrl ? (
          <div className="relative w-full bg-slate-900 max-h-[380px] overflow-hidden flex items-center justify-center">
            <img 
              src={promo.imageUrl} 
              alt={promo.title || 'Promo Banner'} 
              className="w-full h-full object-contain max-h-[380px] select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="relative w-full p-6 sm:p-8 bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-900 text-white overflow-hidden">
            {/* Background Decorative Rings */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-sky-500/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Penawaran Spesial Toko
              </span>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2 text-white">
                {promo.title || 'PROMO SPESIAL AKSESORIS'}
              </h2>

              <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed max-w-md">
                {promo.subtitle || 'Dapatkan aksesoris gadget pilihan kualitas terjamin dengan ketersediaan stok real-time di seluruh cabang kami.'}
              </p>

              {/* Promo highlights badges */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-sky-700/50 text-[11px] font-semibold text-sky-200">
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  100% Produk Original
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Garansi Resmi
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  <Tag className="w-3.5 h-3.5 text-sky-300" />
                  Stok 43 Cabang
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content Body (If poster image was used, show title & subtitle below) */}
        {promo.imageUrl && (
          <div className="p-5 sm:p-6 pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Promo Spesial
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
              {promo.title || 'Promo Hari Ini'}
            </h3>
            {promo.subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {promo.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Action Button & Don't Show Again Footer */}
        <div className={`p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-3 ${!promo.imageUrl ? 'pt-4' : ''}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAction}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-sky-700 to-sky-600 hover:from-sky-800 hover:to-sky-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-sky-700/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <span>{promo.actionText || 'Mulai Belanja & Cek Stok'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs sm:text-sm transition"
            >
              Tutup
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] sm:text-xs text-slate-500 hover:text-slate-700 self-center">
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
