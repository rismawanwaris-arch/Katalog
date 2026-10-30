import React from 'react';
import { Search, X, Layers, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';

export default function FilterBar({
  currentStore,
  reportDate,
  syncing,
  onTriggerSync,
  searchQuery,
  onSearchChange,
  stockFilter, // 'ALL' or 'READY'
  onStockFilterChange,
  selectedBrand,
  onBrandChange,
  brands,
  selectedCategory,
  onCategoryChange,
  categories,
  totalItems,
  onResetFilters
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 mb-6">
      
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Cabang Terpilih
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-sky-900 tracking-tight">
            {currentStore ? `Toko: ${currentStore}` : 'Semua Cabang (Pilih Toko Anda)'}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Terhubung ke Sistem Stok
          </span>
          {reportDate && (
            <span className="text-slate-400 hidden md:inline">
              Tanggal: {reportDate}
            </span>
          )}
          <button
            onClick={onTriggerSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition disabled:opacity-50"
            title="Refresh Stok dari Server Laporan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-sky-600' : ''}`} />
            <span>{syncing ? 'Sinkronisasi...' : 'Sinkronkan'}</span>
          </button>
        </div>
      </div>

      {/* Search & Stock Filter Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4 mb-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama barang, kode item, barcode, merk, watt, atau spesifikasi..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pilihan Filter Stok: Semua Item vs Hanya Stock yang Tersedia */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => onStockFilterChange('ALL')}
            className={`flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              stockFilter === 'ALL'
                ? 'bg-white text-sky-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Semua Item</span>
          </button>

          <button
            type="button"
            onClick={() => onStockFilterChange('READY')}
            className={`flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              stockFilter === 'READY'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Hanya Stock yang Tersedia</span>
          </button>
        </div>

      </div>

      {/* Dropdowns & Reset Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Brand Filter */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-slate-500">Merk:</span>
            <select
              value={selectedBrand}
              onChange={e => onBrandChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Semua Merk (Brand)</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-slate-500">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={e => onCategoryChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-sky-500 max-w-[200px] truncate"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter & Reset */}
        <div className="flex items-center gap-3 ml-auto text-xs sm:text-sm">
          <span className="text-slate-500">
            Menampilkan: <strong className="text-slate-900 font-bold">{totalItems}</strong> produk
          </span>
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-sky-700 hover:text-sky-900 font-bold hover:underline transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

      </div>

    </section>
  );
}
