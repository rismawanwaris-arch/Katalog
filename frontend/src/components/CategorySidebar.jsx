import React, { useState } from 'react';
import { 
  FolderTree, 
  Tag, 
  Banknote, 
  RotateCcw, 
  ChevronLeft, 
  Search, 
  X, 
  Check, 
  Layers, 
  SlidersHorizontal 
} from 'lucide-react';

export default function CategorySidebar({
  categories = [],
  categoryCounts = [],
  selectedCategory,
  onCategoryChange,
  brands = [],
  brandCounts = [],
  selectedBrand,
  onBrandChange,
  priceRange,
  onPriceRangeChange,
  stockFilter,
  onStockFilterChange,
  totalProducts = 0,
  onResetFilters,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) {
  const [catSearch, setCatSearch] = useState('');

  // Map category counts
  const catCountMap = React.useMemo(() => {
    const map = {};
    (categoryCounts || []).forEach(item => {
      map[item.category] = item.count;
    });
    return map;
  }, [categoryCounts]);

  // Map brand counts
  const brandCountMap = React.useMemo(() => {
    const map = {};
    (brandCounts || []).forEach(item => {
      map[item.brand] = item.count;
    });
    return map;
  }, [brandCounts]);

  // Filtered categories by search
  const filteredCategories = React.useMemo(() => {
    if (!catSearch.trim()) return categories;
    return categories.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()));
  }, [categories, catSearch]);

  const hasActiveFilter = 
    (selectedCategory && selectedCategory !== 'ALL') || 
    (selectedBrand && selectedBrand !== 'ALL') || 
    (priceRange && priceRange !== 'ALL') || 
    stockFilter === 'READY';

  const priceRanges = [
    { id: 'ALL', label: 'Semua Harga' },
    { id: 'under_25k', label: '< Rp 25.000' },
    { id: '25k_50k', label: 'Rp 25.000 - Rp 50.000' },
    { id: '50k_100k', label: 'Rp 50.000 - Rp 100.000' },
    { id: 'over_100k', label: '> Rp 100.000' },
  ];

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 leading-tight">Filter Cepat</h3>
            <p className="text-[11px] text-slate-400 font-medium">Navigasi Kategori &amp; Merk</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasActiveFilter && (
            <button
              onClick={onResetFilters}
              title="Reset Semua Filter"
              className="p-1.5 text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-lg transition font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Reset</span>
            </button>
          )}

          {/* Collapse button on desktop */}
          <button
            onClick={onToggleCollapse}
            title="Sembunyikan Panel Filter"
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            title="Tutup Filter"
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Filter Area */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-slate-700 custom-scrollbar">

        {/* 1. SEKSI KATEGORI */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <FolderTree className="w-3.5 h-3.5 text-sky-600" />
              Kategori
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {categories.length} tipe
            </span>
          </div>

          {/* Search Category */}
          {categories.length > 8 && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kategori..."
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-sky-500 bg-slate-50 focus:bg-white transition"
              />
              {catSearch && (
                <button
                  onClick={() => setCatSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* List Kategori */}
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {/* Opsi Semua Kategori */}
            <button
              type="button"
              onClick={() => onCategoryChange('ALL')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                !selectedCategory || selectedCategory === 'ALL'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span className="truncate">Semua Kategori</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                !selectedCategory || selectedCategory === 'ALL'
                  ? 'bg-sky-900/40 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {totalProducts}
              </span>
            </button>

            {/* List Kategori filtered */}
            {filteredCategories.map(cat => {
              const isSelected = selectedCategory === cat;
              const count = catCountMap[cat] || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onCategoryChange(isSelected ? 'ALL' : cat)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                    isSelected
                      ? 'bg-sky-700 text-white font-bold shadow-sm'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate pr-2">{cat}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                      isSelected
                        ? 'bg-sky-900/40 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredCategories.length === 0 && (
              <p className="text-[11px] text-slate-400 py-2 text-center">
                Kategori tidak ditemukan
              </p>
            )}
          </div>
        </div>

        {/* 2. SEKSI MERK / BRAND */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-sky-600" />
              Merk (Brand)
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onBrandChange('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                !selectedBrand || selectedBrand === 'ALL'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              Semua
            </button>

            {brands.map(brand => {
              const isSelected = selectedBrand === brand;
              const count = brandCountMap[brand] || 0;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => onBrandChange(isSelected ? 'ALL' : brand)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition ${
                    isSelected
                      ? 'bg-sky-700 text-white font-bold shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium'
                  }`}
                >
                  <span>{brand}</span>
                  {count > 0 && (
                    <span className={`text-[9px] font-bold px-1 rounded-full ${
                      isSelected ? 'bg-sky-900/40 text-white' : 'text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SEKSI RENTANG HARGA */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Banknote className="w-3.5 h-3.5 text-sky-600" />
              Rentang Harga
            </span>
          </div>

          <div className="space-y-1">
            {priceRanges.map(pr => {
              const isSelected = (!priceRange && pr.id === 'ALL') || priceRange === pr.id;
              return (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => onPriceRangeChange(pr.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                    isSelected
                      ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span>{pr.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-64 xl:w-72'
        }`}
      >
        <div className="sticky top-20 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm max-h-[calc(100vh-6rem)] flex flex-col">
          {content}
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl p-5 z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
