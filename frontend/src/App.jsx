import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import ProductCompareModal from './components/ProductCompareModal';
import CompareFloatingBar from './components/CompareFloatingBar';
import StoreModal from './components/StoreModal';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLoginPage from './components/admin/AdminLoginPage';
import { PackageSearch, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  // View Routing: 'public' or 'admin'
  const [viewMode, setViewMode] = useState(() => {
    return window.location.hash === '#admin' ? 'admin' : 'public';
  });

  // Store & Auth
  const [currentStore, setCurrentStore] = useState(() => localStorage.getItem('katalog_store') || '');
  const [outlets, setOutlets] = useState([]);
  const [reportDate, setReportDate] = useState('');
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('katalog_admin_token') || '');

  // Products & Filtering
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' or 'READY'
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'az', 'za', 'price_asc', 'price_desc', 'category'
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modals
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comparedProducts, setComparedProducts] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Sync hash with viewMode
  useEffect(() => {
    function handleHashChange() {
      if (window.location.hash === '#admin') {
        setViewMode('admin');
      } else {
        setViewMode('public');
      }
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function handleGoToAdmin() {
    window.location.hash = '#admin';
    setViewMode('admin');
  }

  function handleExitAdmin() {
    window.location.hash = '';
    setViewMode('public');
    loadProducts(); // refresh products in case any items/categories changed
  }

  // Load Outlets on Mount
  useEffect(() => {
    async function fetchOutlets() {
      try {
        const res = await fetch('/api/outlets');
        const data = await res.json();
        if (data.success) {
          setOutlets(data.outlets || []);
          if (data.reportDate) setReportDate(data.reportDate);
        }
      } catch (err) {
        console.error('Error fetching outlets:', err);
      }
    }
    fetchOutlets();
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedBrand && selectedBrand !== 'ALL') params.set('brand', selectedBrand);
      if (selectedCategory && selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (currentStore) params.set('outlet', currentStore);
      if (stockFilter === 'READY') params.set('ready', 'true');
      if (sortBy && sortBy !== 'default') params.set('sort', sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.products || []);
        setTotalProducts(data.total || 0);
        if (data.brands && brands.length === 0) setBrands(data.brands);
        if (data.categories && categories.length === 0) setCategories(data.categories);
        if (data.reportDate) setReportDate(data.reportDate);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedBrand, selectedCategory, currentStore, stockFilter, sortBy, brands.length, categories.length]);

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  // Store Selection Handler
  function handleSelectStore(storeName) {
    setCurrentStore(storeName);
    localStorage.setItem('katalog_store', storeName);
  }

  // Trigger Real-time Stock Sync
  async function handleTriggerSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync-stock', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.reportDate) setReportDate(data.reportDate);
        await loadProducts();
      }
    } catch (err) {
      console.error('Error syncing stock:', err);
    } finally {
      setSyncing(false);
    }
  }

  // Reset Filters
  function handleResetFilters() {
    setSearchQuery('');
    setStockFilter('ALL');
    setSelectedBrand('ALL');
    setSelectedCategory('ALL');
    setSortBy('default');
  }

  // Open Product Detail Modal
  async function handleOpenDetail(itemCode) {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(itemCode)}?outlet=${encodeURIComponent(currentStore)}`);
      const data = await res.json();
      if (data.success && data.product) {
        setSelectedProduct(data.product);
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error('Error fetching product detail:', err);
    }
  }

  // Product Comparison Handlers
  function handleToggleCompare(product) {
    if (!product) return;
    setComparedProducts(prev => {
      const exists = prev.some(p => p.item_code === product.item_code);
      if (exists) {
        return prev.filter(p => p.item_code !== product.item_code);
      } else {
        if (prev.length >= 4) {
          alert('Maksimal dapat membandingkan 4 produk sekaligus.');
          return prev;
        }
        return [...prev, product];
      }
    });
  }

  function handleRemoveComparedProduct(itemCode) {
    setComparedProducts(prev => prev.filter(p => p.item_code !== itemCode));
  }

  function handleClearCompare() {
    setComparedProducts([]);
  }

  function handleOpenCompareModal() {
    if (comparedProducts.length < 2) {
      alert('Pilih minimal 2 produk untuk dibandingkan secara bersisian.');
      return;
    }
    setIsCompareModalOpen(true);
  }

  // Admin Auth
  function handleLoginSuccess(token) {
    setAdminToken(token);
    sessionStorage.setItem('katalog_admin_token', token);
  }

  function handleLogoutAdmin() {
    setAdminToken('');
    sessionStorage.removeItem('katalog_admin_token');
    handleExitAdmin();
  }

  // ============================================================
  // RENDER: ADMIN DASHBOARD VIEW
  // ============================================================
  if (viewMode === 'admin') {
    if (!adminToken) {
      return (
        <AdminLoginPage
          onLoginSuccess={handleLoginSuccess}
          onCancel={handleExitAdmin}
        />
      );
    }

    return (
      <AdminDashboard
        adminToken={adminToken}
        outlets={outlets}
        onExitAdmin={handleExitAdmin}
        onLogout={handleLogoutAdmin}
      />
    );
  }

  // ============================================================
  // RENDER: PUBLIC CATALOG VIEW
  // ============================================================
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Top Navbar */}
      <Navbar
        currentStore={currentStore}
        onOpenStoreModal={() => setIsStoreModalOpen(true)}
        adminToken={adminToken}
        onGoToAdmin={handleGoToAdmin}
        syncing={syncing}
        onTriggerSync={handleTriggerSync}
        reportDate={reportDate}
        comparedCount={comparedProducts.length}
        onOpenCompare={handleOpenCompareModal}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        
        {/* Filter Bar with Store Status & Stock Tabs */}
        <FilterBar
          currentStore={currentStore}
          reportDate={reportDate}
          syncing={syncing}
          onTriggerSync={handleTriggerSync}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          brands={brands}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalItems={totalProducts}
          onResetFilters={handleResetFilters}
        />

        {/* Product Grid Area */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 flex flex-col justify-between animate-pulse">
                <div>
                  <div className="w-full aspect-square bg-slate-200/70 rounded-xl mb-3" />
                  <div className="h-4 bg-slate-200/80 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-slate-200/80 rounded w-5/6 mb-1.5" />
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="h-5 bg-slate-200/80 rounded w-2/5" />
                  <div className="h-7 bg-slate-200/80 rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <PackageSearch className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Tidak Ada Produk yang Ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-4">
              {stockFilter === 'READY' && currentStore
                ? `Tidak ada item yang memiliki stok ready di toko ${currentStore} dengan filter saat ini.`
                : 'Coba ubah kata kunci pencarian atau reset filter untuk melihat item lainnya.'}
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-sky-700 text-white rounded-xl text-xs font-bold hover:bg-sky-800 transition"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map(p => (
              <ProductCard
                key={p.item_code}
                product={p}
                currentStore={currentStore}
                onOpenDetail={handleOpenDetail}
                isCompared={comparedProducts.some(cp => cp.item_code === p.item_code)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Compare Bar */}
      <CompareFloatingBar
        comparedProducts={comparedProducts}
        onOpenCompare={handleOpenCompareModal}
        onRemoveProduct={handleRemoveComparedProduct}
        onClearAll={handleClearCompare}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Katalog Aksesoris &amp; Product Knowledge © 2026. Terhubung API Stok Cabang.
          </span>
          <button
            onClick={handleGoToAdmin}
            className="flex items-center gap-1 text-slate-500 hover:text-sky-700 font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Masuk Panel Admin
          </button>
        </div>
      </footer>

      {/* Modals */}
      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        outlets={outlets}
        currentStore={currentStore}
        onSelectStore={handleSelectStore}
      />

      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={selectedProduct}
        currentStore={currentStore}
        isCompared={selectedProduct && comparedProducts.some(cp => cp.item_code === selectedProduct.item_code)}
        onToggleCompare={handleToggleCompare}
      />

      <ProductCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparedProducts={comparedProducts}
        onRemoveProduct={handleRemoveComparedProduct}
        onClearAll={handleClearCompare}
        currentStore={currentStore}
        onOpenDetail={handleOpenDetail}
      />

    </div>
  );
}
