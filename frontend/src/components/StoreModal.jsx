import React, { useState } from 'react';
import { Store, Search, X, Check } from 'lucide-react';

export default function StoreModal({ isOpen, onClose, outlets, currentStore, onSelectStore }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredOutlets = (outlets || []).filter(o =>
    o.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Pilih Toko Cabang Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Ketersediaan stok akan otomatis dicocokkan dengan toko yang Anda pilih
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Outlets */}
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik nama toko (contoh: ALFA 7, SUCI, BINTANG)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
              autoFocus
            />
          </div>
        </div>

        {/* Outlets Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[50vh]">
          {filteredOutlets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Tidak ada nama cabang yang cocok dengan "{searchTerm}".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredOutlets.map(o => {
                const isSelected = o === currentStore;
                return (
                  <button
                    key={o}
                    onClick={() => {
                      onSelectStore(o);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-300'
                    }`}
                  >
                    <span className="truncate">{o}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Total {outlets.length} Cabang Tersedia</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
