import React from 'react';
import { Search, X, Layers, CheckCircle2, RefreshCw, RotateCcw, ArrowUpDown, SlidersHorizontal, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

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
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  totalItems,
  onResetFilters,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar
}) {
  const priceLabels = {
    under_25k: '< Rp 25.000',
    '25k_50k': 'Rp 25.000 - Rp 50.000',
    '50k_100k': 'Rp 50.000 - Rp 100.000',
    over_100k: '> Rp 100.000'
  };

  const hasActiveFilters = 
    (selectedBrand && selectedBrand !== 'ALL') || 
    (selectedCategory && selectedCategory !== 'ALL') || 
    (priceRange && priceRange !== 'ALL') || 
    stockFilter === 'READY' || 
    Boolean(searchQuery.trim());

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-5">
      
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          {/* Toggle Sidebar Button Desktop */}
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Buka Sidebar Kategori" : "Sembunyikan Sidebar Kategori"}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-sky-700" /> : <PanelLeftClose className="w-4 h-4 text-slate-500" />}
            <span>{isSidebarCollapsed ? "Buka Filter" : "Tutup Panel"}</span>
          </button>

          {/* Toggle Sidebar Button Mobile */}
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-700" />
            <span>Kategori &amp; Filter</span>
          </button>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block leading-tight">
              Cabang Terpilih
            </span>
            <h2 className="text-base sm:text-xl font-black text-sky-900 tracking-tight">
              {currentStore ? `Toko: ${currentStore}` : 'Semua Cabang (Pilih Toko Anda)'}
            </h2>
          </div>
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
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-3.5">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama barang, kode item, barcode, merk, watt, atau spesifikasi..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all ${
              stockFilter === 'ALL'
                ? 'bg-white text-sky-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span>Semua Item</span>
          </button>

          <button
            type="button"
            onClick={() => onStockFilterChange('READY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all ${
              stockFilter === 'READY'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Hanya Stock Ready</span>
          </button>
        </div>

      </div>

      {/* Dropdowns & Reset Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="font-semibold text-slate-500">Merk:</span>
            <select
              value={selectedBrand}
              onChange={e => onBrandChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Semua Merk</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="font-semibold text-slate-500">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={e => onCategoryChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none focus:border-sky-500 max-w-[180px] truncate"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              Urutkan:
            </span>
            <select
              value={sortBy || 'default'}
              onChange={e => onSortChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="default">Default</option>
              <option value="az">Abjad A - Z</option>
              <option value="za">Abjad Z - A</option>
              <option value="price_asc">Harga Termurah</option>
              <option value="price_desc">Harga Termahal</option>
              <option value="category">Kategori (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Counter & Reset */}
        <div className="flex items-center gap-3 ml-auto text-xs">
          <span className="text-slate-500">
            Total: <strong className="text-slate-900 font-bold">{totalItems}</strong> produk
          </span>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-sky-700 hover:text-sky-900 font-bold hover:underline transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

      </div>

      {/* Active Filter Pills (if any) */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-2.5 mt-2.5 border-t border-slate-100 text-[11px]">
          <span className="text-slate-400 font-semibold mr-1">Filter Aktif:</span>
          {selectedCategory && selectedCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-medium">
              Kategori: {selectedCategory}
              <button onClick={() => onCategoryChange('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedBrand && selectedBrand !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Merk: {selectedBrand}
              <button onClick={() => onBrandChange('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {priceRange && priceRange !== 'ALL' && priceLabels[priceRange] && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-medium">
              Harga: {priceLabels[priceRange]}
              <button onClick={() => onPriceRangeChange('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {stockFilter === 'READY' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Hanya Stok Tersedia
              <button onClick={() => onStockFilterChange('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              Cari: "{searchQuery}"
              <button onClick={() => onSearchChange('')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

    </section>
  );
}
