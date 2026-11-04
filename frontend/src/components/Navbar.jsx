import React from 'react';
import { MapPin, Lock, LogOut, PlusCircle, RefreshCw, Smartphone, ArrowLeftRight } from 'lucide-react';

export default function Navbar({
  currentStore,
  onOpenStoreModal,
  adminToken,
  onGoToAdmin,
  syncing,
  onTriggerSync,
  reportDate,
  comparedCount = 0,
  onOpenCompare
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-sky-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-600/20 shrink-0">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight truncate">
                KATALOG AKSESORIS
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block truncate">
                Product Knowledge &amp; Ketersediaan Stok 43 Cabang Real-Time
              </p>
            </div>
          </div>

          {/* Actions: Store Selector & Admin */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Compare Badge Button (if products are selected) */}
            {comparedCount > 0 && (
              <button
                onClick={onOpenCompare}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold transition-all duration-150 active:scale-95 shadow-sm animate-fade-fast cursor-pointer"
                title="Buka Perbandingan Produk"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="hidden sm:inline">Bandingkan</span>
                <span className="bg-white text-sky-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {comparedCount}
                </span>
              </button>
            )}

            {/* Store Badge Button */}
            <button
              onClick={onOpenStoreModal}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 shadow-sm ${
                currentStore
                  ? 'bg-sky-50/90 border-sky-300 text-sky-900 hover:bg-sky-100 hover:border-sky-400'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 animate-pulse'
              }`}
            >
              <MapPin className={`w-4 h-4 shrink-0 ${currentStore ? 'text-sky-600' : 'text-amber-600'}`} />
              <div className="text-left leading-tight">
                <span className="text-[10px] sm:text-xs text-slate-500 block">Toko Anda:</span>
                <span className="font-bold truncate max-w-[120px] sm:max-w-[160px] inline-block align-bottom">
                  {currentStore || 'PILIH TOKO...'}
                </span>
              </div>
              <span className="bg-sky-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 hidden xs:inline-block">
                Ganti
              </span>
            </button>

            {/* Admin Portal Button */}
            <button
              onClick={onGoToAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-150 active:scale-95 shadow-xs ${
                adminToken
                  ? 'bg-sky-50 border-sky-300 text-sky-900 hover:bg-sky-100'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Buka Halaman Khusus Admin"
            >
              <Lock className={`w-4 h-4 ${adminToken ? 'text-sky-700' : 'text-slate-500'}`} />
              <span>{adminToken ? 'Dashboard Admin' : 'Admin'}</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
