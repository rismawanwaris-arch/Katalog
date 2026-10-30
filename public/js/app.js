/**
 * Katalog Aksesoris & Product Knowledge Frontend Application
 */

let currentStore = localStorage.getItem('katalog_store') || '';
let adminToken = sessionStorage.getItem('katalog_admin_token') || '';
let currentStockFilter = 'ALL'; // 'ALL' or 'READY'
let outletsList = [];
let currentProducts = [];
let selectedProduct = null;
let searchDebounceTimeout = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  updateAdminUI();
  await loadOutlets();
  
  if (!currentStore) {
    // Open store selector on first visit
    openStoreModal();
  } else {
    updateStoreDisplay();
  }

  await loadProducts();
});

// -------------------------------------------------------------
// STORE MANAGEMENT
// -------------------------------------------------------------
async function loadOutlets() {
  try {
    const res = await fetch('/api/outlets');
    const json = await res.json();
    if (json.success && json.outlets) {
      outletsList = json.outlets;
      if (json.reportDate) {
        document.getElementById('syncDateLabel').textContent = `Laporan Stok Tanggal: ${json.reportDate}`;
      }
      renderOutletGrid();
    }
  } catch (err) {
    console.error('Error loading outlets:', err);
  }
}

function updateStoreDisplay() {
  const storeNameEl = document.getElementById('currentStoreName');
  const bannerStoreEl = document.getElementById('bannerStoreName');

  if (currentStore) {
    storeNameEl.textContent = currentStore;
    bannerStoreEl.textContent = `Toko: ${currentStore}`;
  } else {
    storeNameEl.textContent = 'PILIH TOKO...';
    bannerStoreEl.textContent = 'Semua Cabang (Pilih Toko Anda)';
  }
}

function openStoreModal() {
  document.getElementById('modalSelectStore').classList.remove('hidden');
  document.getElementById('outletSearchInput').value = '';
  filterOutletList();
  lucide.createIcons();
}

function closeStoreModal() {
  document.getElementById('modalSelectStore').classList.add('hidden');
}

function selectStore(outletName) {
  currentStore = outletName;
  localStorage.setItem('katalog_store', currentStore);
  updateStoreDisplay();
  closeStoreModal();
  loadProducts(); // reload products with new store stock binding
}

function renderOutletGrid(filterText = '') {
  const container = document.getElementById('outletListContainer');
  container.innerHTML = '';

  const q = filterText.toLowerCase().trim();
  const filtered = outletsList.filter(o => o.toLowerCase().includes(q));

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-sm text-muted" style="grid-column: 1/-1; text-align: center;">Tidak ada toko yang cocok.</p>';
    return;
  }

  filtered.forEach(o => {
    const btn = document.createElement('button');
    btn.className = `outlet-select-btn ${o === currentStore ? 'active' : ''}`;
    btn.innerHTML = `<i data-lucide="store" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> ${o}`;
    btn.onclick = () => selectStore(o);
    container.appendChild(btn);
  });

  lucide.createIcons();
}

function filterOutletList() {
  const text = document.getElementById('outletSearchInput').value;
  renderOutletGrid(text);
}

// -------------------------------------------------------------
// PRODUCT LOADING & FILTERING
// -------------------------------------------------------------
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Memuat katalog produk dan mencocokkan stok cabang ${currentStore ? `<strong>${currentStore}</strong>` : ''}...</p>
    </div>
  `;

  try {
    const q = document.getElementById('searchInput').value.trim();
    const brand = document.getElementById('filterBrand').value;
    const category = document.getElementById('filterCategory').value;
    const onlyReady = (currentStockFilter === 'READY');

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (brand && brand !== 'ALL') params.set('brand', brand);
    if (category && category !== 'ALL') params.set('category', category);
    if (currentStore) params.set('outlet', currentStore);
    if (onlyReady) params.set('ready', 'true');

    const res = await fetch(`/api/products?${params.toString()}`);
    const json = await res.json();

    if (!json.success) {
      grid.innerHTML = `<div class="empty-state"><p>Gagal memuat produk: ${json.message}</p></div>`;
      return;
    }

    currentProducts = json.products || [];
    document.getElementById('itemCount').textContent = json.total || currentProducts.length;

    // Populate dropdowns once
    populateFilterOptions(json.brands || [], json.categories || []);

    renderProductGrid();
  } catch (err) {
    console.error('Error loading products:', err);
    grid.innerHTML = `<div class="empty-state"><p>Terjadi kesalahan saat memuat katalog: ${err.message}</p></div>`;
  }
}

function populateFilterOptions(brands, categories) {
  const brandSelect = document.getElementById('filterBrand');
  const catSelect = document.getElementById('filterCategory');

  const currentBrandVal = brandSelect.value;
  const currentCatVal = catSelect.value;

  // Only repopulate if single option exists
  if (brandSelect.options.length <= 1) {
    brands.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      brandSelect.appendChild(opt);
    });
    brandSelect.value = currentBrandVal || 'ALL';
  }

  if (catSelect.options.length <= 1) {
    categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      catSelect.appendChild(opt);
    });
    catSelect.value = currentCatVal || 'ALL';
  }
}

// -------------------------------------------------------------
// BRAND THEME & VECTOR SVG PLACEHOLDER GENERATOR
// -------------------------------------------------------------
function getBrandTheme(brand) {
  const b = (brand || '').toUpperCase().trim();
  const themes = {
    'VENTION': { bg1: '#0284c7', bg2: '#0369a1', light: '#e0f2fe' },
    'UGREEN': { bg1: '#059669', bg2: '#047857', light: '#d1fae5' },
    'ROBOT': { bg1: '#ea580c', bg2: '#c2410c', light: '#ffedd5' },
    'VIVAN': { bg1: '#d97706', bg2: '#b45309', light: '#fef3c7' },
    'REXI': { bg1: '#9333ea', bg2: '#7e22ce', light: '#f3e8ff' },
    'IPHONE': { bg1: '#334155', bg2: '#1e293b', light: '#f1f5f9' },
    'SAMSUNG': { bg1: '#4338ca', bg2: '#3730a3', light: '#e0e7ff' },
    'INFINIX': { bg1: '#10b981', bg2: '#059669', light: '#ecfdf5' },
    'FOOMEE': { bg1: '#e11d48', bg2: '#be123c', light: '#ffe4e6' },
    'UFONE': { bg1: '#16a34a', bg2: '#15803d', light: '#dcfce7' },
    'OPPO': { bg1: '#047857', bg2: '#065f46', light: '#d1fae5' },
    'VIVO': { bg1: '#2563eb', bg2: '#1d4ed8', light: '#dbeafe' }
  };
  return themes[b] || { bg1: '#1F4E79', bg2: '#163857', light: '#e8f0fe' };
}

function getCategoryIconSvg(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('charger') || c.includes('batok')) {
    return `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (c.includes('kabel') || c.includes('cable') || c.includes('cord')) {
    return `<path d="M4 8h8a4 4 0 0 1 4 4v4a4 4 0 0 0 4 4h4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="4" cy="8" r="2" fill="currentColor"/><circle cx="24" cy="20" r="2" fill="currentColor"/>`;
  }
  if (c.includes('tws') || c.includes('earphone') || c.includes('handsfree') || c.includes('audio')) {
    return `<path d="M3 14v4a4 4 0 0 0 4 4h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H4a1 1 0 0 0-1 1zm18 0v4a4 4 0 0 1-4 4h-1a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h3a1 1 0 0 1 1 1z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M3 14v-2a9 9 0 0 1 18 0v2" fill="none" stroke="currentColor" stroke-width="2.5"/>`;
  }
  if (c.includes('powerbank') || c.includes('battery')) {
    return `<rect x="2" y="7" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M22 11v4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M7 13h4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  if (c.includes('hub') || c.includes('adapter') || c.includes('converter') || c.includes('dongle')) {
    return `<rect x="6" y="4" width="12" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M9 18v4h6v-4" stroke="currentColor" stroke-width="2.5"/><circle cx="10" cy="9" r="1" fill="currentColor"/><circle cx="14" cy="9" r="1" fill="currentColor"/>`;
  }
  return `<rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M3 10h18M10 20V10" stroke="currentColor" stroke-width="2.5"/>`;
}

function getProductPlaceholderSrc(brand, category, itemCode) {
  const t = getBrandTheme(brand);
  const icon = getCategoryIconSvg(category);
  const cleanBrand = (brand || 'AKSESORIS').replace(/[^a-zA-Z0-9 -]/g, '');
  const cleanCode = (itemCode || '').replace(/[^a-zA-Z0-9 -]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <defs>
      <linearGradient id="g_${cleanCode}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${t.light}"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g_${cleanCode})" rx="12"/>
    <rect x="16" y="16" width="368" height="268" fill="none" stroke="${t.bg1}" stroke-opacity="0.15" stroke-width="1.5" stroke-dasharray="6,6" rx="8"/>
    <rect x="130" y="32" width="140" height="26" rx="13" fill="${t.bg1}"/>
    <text x="200" y="49" fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1.5">${cleanBrand}</text>
    <circle cx="200" cy="140" r="50" fill="${t.light}" stroke="${t.bg1}" stroke-width="2" stroke-opacity="0.3"/>
    <g transform="translate(182, 122) scale(1.5)" color="${t.bg1}">
      ${icon}
    </g>
    <text x="200" y="225" fill="${t.bg2}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="700" text-anchor="middle">KODE ITEM: ${cleanCode}</text>
    <text x="200" y="245" fill="#64748b" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="11" text-anchor="middle">Produk Resmi &amp; Bergaransi</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function getProductImageSrc(p) {
  if (p.image_url && !p.image_url.includes('images.tokopedia.net') && !p.image_url.includes('placehold.co')) {
    return p.image_url;
  }
  return getProductPlaceholderSrc(p.brand, p.category, p.item_code);
}

function renderProductGrid() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';

  if (currentProducts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="package-search" style="width: 48px; height: 48px; margin: 0 auto 12px; color: #94a3b8;"></i>
        <p>Tidak ada produk yang sesuai dengan kriteria filter atau pencarian Anda.</p>
        <button class="btn btn-outline btn-sm mt-4" onclick="resetFilters()">Reset Semua Filter</button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  currentProducts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Stock Badge Display
    let stockBadgeHtml = '';
    if (currentStore) {
      if (p.outletStock > 0) {
        stockBadgeHtml = `
          <div class="stock-status-badge in-stock">
            <i data-lucide="check-circle-2"></i>
            <span>Tersedia di Toko Anda: <strong>${p.outletStock} Pcs</strong></span>
          </div>
        `;
      } else {
        stockBadgeHtml = `
          <div class="stock-status-badge out-of-stock">
            <i data-lucide="alert-circle"></i>
            <span>Stok Tidak Ada di Toko Anda (0 Pcs)</span>
          </div>
        `;
      }
    } else {
      stockBadgeHtml = `
        <div class="stock-status-badge in-stock" style="background: #f1f5f9; color: #334155; border-color: #cbd5e1;">
          <i data-lucide="info"></i>
          <span>Total Stok Seluruh Cabang: <strong>${p.totalNetworkStock} Pcs</strong></span>
        </div>
      `;
    }

    const imgSrc = getProductImageSrc(p);
    const fallbackSvg = getProductPlaceholderSrc(p.brand, p.category, p.item_code);

    card.innerHTML = `
      <div class="card-image-box">
        <div class="card-badges-top">
          <span class="badge badge-brand">${escapeHtml(p.brand)}</span>
          <span class="badge badge-category">${escapeHtml(p.category)}</span>
        </div>
        <img src="${imgSrc}" 
             alt="${escapeHtml(p.official_name)}" 
             loading="lazy"
             onerror="this.onerror=null; this.src='${fallbackSvg}';">
      </div>

      <div class="card-body">
        <h3 class="card-title" title="${escapeHtml(p.official_name)}">${escapeHtml(p.official_name)}</h3>
        
        <div class="card-code-row">
          <span>Kode: <strong>${escapeHtml(p.item_code)}</strong></span>
          <span>SKU: <strong>${escapeHtml(p.official_sku || '-')}</strong></span>
        </div>

        ${stockBadgeHtml}

        <div class="card-spec-highlight">
          <strong>Spesifikasi:</strong> ${escapeHtml(p.main_spec || '-')}
        </div>

        <div class="card-footer">
          <span class="text-xs text-muted">Barcode: ${escapeHtml(p.barcode || '-')}</span>
          <button class="btn btn-outline btn-sm" onclick="openProductDetail('${escapeHtml(p.item_code)}')">
            <i data-lucide="eye"></i> Detail 17 Kolom
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  lucide.createIcons();
}

function handleSearch() {
  clearTimeout(searchDebounceTimeout);
  const q = document.getElementById('searchInput').value.trim();
  document.getElementById('btnClearSearch').style.display = q ? 'block' : 'none';

  searchDebounceTimeout = setTimeout(() => {
    loadProducts();
  }, 300);
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('btnClearSearch').style.display = 'none';
  loadProducts();
}

function handleFilterChange() {
  loadProducts();
}

function setStockFilter(type) {
  currentStockFilter = type;

  // Sinkronkan Button Pills
  const btnAll = document.getElementById('btnFilterAll');
  const btnReady = document.getElementById('btnFilterReady');
  if (btnAll && btnReady) {
    if (type === 'READY') {
      btnAll.classList.remove('active');
      btnReady.classList.add('active');
    } else {
      btnAll.classList.add('active');
      btnReady.classList.remove('active');
    }
  }

  // Sinkronkan Dropdown Status Stok
  const selectStock = document.getElementById('filterStockStatus');
  if (selectStock) {
    selectStock.value = type;
  }

  loadProducts();
}

function handleStockDropdownChange() {
  const selectStock = document.getElementById('filterStockStatus');
  if (selectStock) {
    setStockFilter(selectStock.value);
  }
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('btnClearSearch').style.display = 'none';
  document.getElementById('filterBrand').value = 'ALL';
  document.getElementById('filterCategory').value = 'ALL';
  setStockFilter('ALL');
}

// -------------------------------------------------------------
// DETAIL MODAL (17 KOLOM LENGKAP)
// -------------------------------------------------------------
async function openProductDetail(itemCode) {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(itemCode)}?outlet=${encodeURIComponent(currentStore)}`);
    const json = await res.json();

    if (!json.success || !json.product) {
      alert('Gagal memuat detail produk');
      return;
    }

    selectedProduct = json.product;
    const p = selectedProduct;

    // Header & Badges
    document.getElementById('detailBrand').textContent = p.brand;
    document.getElementById('detailCategory').textContent = p.category;
    document.getElementById('detailOfficialName').textContent = p.official_name;
    document.getElementById('detailSkuCode').textContent = `SKU: ${p.official_sku || '-'} | Kode ERP: ${p.item_code} | Barcode: ${p.barcode || '-'}`;

    // Sidebar Image
    const imgEl = document.getElementById('detailImage');
    const modalImgSrc = getProductImageSrc(p);
    imgEl.src = modalImgSrc;
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = getProductPlaceholderSrc(p.brand, p.category, p.item_code);
    };

    // Sidebar Stock Box
    document.getElementById('detailStoreHeader').textContent = currentStore ? `Toko Anda: ${currentStore}` : 'Pilih Toko Anda Terlebih Dahulu';
    const statusBox = document.getElementById('detailStoreStockStatus');

    if (currentStore) {
      if (p.outletStock > 0) {
        statusBox.innerHTML = `
          <div class="stock-status-badge in-stock" style="margin: 0;">
            <i data-lucide="check-circle-2"></i>
            <span>Stok Tersedia: <strong>${p.outletStock} Pcs</strong></span>
          </div>
        `;
      } else {
        statusBox.innerHTML = `
          <div class="stock-status-badge out-of-stock" style="margin: 0;">
            <i data-lucide="alert-circle"></i>
            <span>Stok Tidak Ada di Toko Anda (0 Pcs)</span>
          </div>
        `;
      }
    } else {
      statusBox.innerHTML = `
        <button class="btn btn-primary btn-sm btn-block" onclick="openStoreModal()">
          <i data-lucide="map-pin"></i> Tentukan Toko Anda
        </button>
      `;
    }

    document.getElementById('detailTotalNetworkStock').textContent = `${p.totalNetworkStock || 0} Pcs`;

    // Sidebar Links
    const storeLink = document.getElementById('detailOfficialStoreLink');
    if (p.official_store_url) {
      storeLink.href = p.official_store_url;
      storeLink.style.display = 'inline-flex';
    } else {
      storeLink.style.display = 'none';
    }

    const imgHdLink = document.getElementById('detailImageHdLink');
    if (p.image_url) {
      imgHdLink.href = p.image_url;
      imgHdLink.style.display = 'inline-flex';
    } else {
      imgHdLink.style.display = 'none';
    }

    // 17 COLUMNS IN TABLE
    document.getElementById('tableNo').textContent = p.item_no || '-';
    document.getElementById('tableItemCode').textContent = p.item_code || '-';
    document.getElementById('tableItemName').textContent = p.item_name || '-';
    document.getElementById('tableItemAlias').textContent = p.item_alias || '-';
    document.getElementById('tableBarcode').textContent = p.barcode || '-';
    document.getElementById('tableBrand').textContent = p.brand || '-';
    document.getElementById('tableCategory').textContent = p.category || '-';
    document.getElementById('tableOfficialSku').textContent = p.official_sku || '-';
    document.getElementById('tableOfficialName').textContent = p.official_name || '-';
    document.getElementById('tableMainSpec').textContent = p.main_spec || '-';
    document.getElementById('tableDetailSpec').textContent = p.detail_spec || '-';
    document.getElementById('tableInterface').textContent = p.interface || '-';
    document.getElementById('tableCompatibility').textContent = p.compatibility || '-';
    document.getElementById('tableColor').textContent = p.color || '-';

    const tableImgLink = document.getElementById('tableImageUrl');
    if (p.image_url) {
      tableImgLink.href = p.image_url;
      tableImgLink.textContent = p.image_url;
    } else {
      tableImgLink.removeAttribute('href');
      tableImgLink.textContent = 'Tidak Tersedia';
    }

    const tableStoreLink = document.getElementById('tableStoreUrl');
    if (p.official_store_url) {
      tableStoreLink.href = p.official_store_url;
      tableStoreLink.textContent = p.official_store_url;
    } else {
      tableStoreLink.removeAttribute('href');
      tableStoreLink.textContent = 'Tidak Tersedia';
    }

    document.getElementById('tableStatusData').textContent = p.status_data || 'Lengkap';

    // Populate Other Branches Grid
    const branchesGrid = document.getElementById('branchesStockGrid');
    branchesGrid.innerHTML = '';
    const breakdown = p.allOutletsBreakdown || [];

    breakdown.forEach(b => {
      const isCurrent = b.outlet === currentStore;
      const pill = document.createElement('div');
      pill.className = `branch-stock-pill ${b.stock > 0 ? 'has-stock' : ''}`;
      pill.innerHTML = `
        <span>${isCurrent ? '📍 ' : ''}${escapeHtml(b.outlet)}</span>
        <span><strong>${b.stock}</strong> Pcs</span>
      `;
      branchesGrid.appendChild(pill);
    });

    // Reset accordion
    document.getElementById('otherBranchesList').classList.add('hidden');
    document.getElementById('chevronOtherBranches').setAttribute('data-lucide', 'chevron-down');

    // Admin Action buttons inside detail
    const adminActions = document.getElementById('adminProductActions');
    if (adminToken) {
      adminActions.classList.remove('hidden');
    } else {
      adminActions.classList.add('hidden');
    }

    document.getElementById('modalProductDetail').classList.remove('hidden');
    lucide.createIcons();
  } catch (err) {
    console.error('Error opening product detail:', err);
  }
}

function closeProductDetailModal() {
  document.getElementById('modalProductDetail').classList.add('hidden');
  selectedProduct = null;
}

function toggleOtherBranches() {
  const content = document.getElementById('otherBranchesList');
  const chevron = document.getElementById('chevronOtherBranches');
  const isHidden = content.classList.contains('hidden');

  if (isHidden) {
    content.classList.remove('hidden');
    chevron.setAttribute('data-lucide', 'chevron-up');
  } else {
    content.classList.add('hidden');
    chevron.setAttribute('data-lucide', 'chevron-down');
  }
  lucide.createIcons();
}

// -------------------------------------------------------------
// ADMIN ACTIONS & FORM
// -------------------------------------------------------------
function updateAdminUI() {
  const btnLogin = document.getElementById('btnLoginModal');
  const adminControls = document.getElementById('adminControls');

  if (adminToken) {
    btnLogin.classList.add('hidden');
    adminControls.classList.remove('hidden');
  } else {
    btnLogin.classList.remove('hidden');
    adminControls.classList.add('hidden');
  }
  lucide.createIcons();
}

function openLoginModal() {
  document.getElementById('modalLogin').classList.remove('hidden');
  document.getElementById('adminPasswordInput').value = '';
}

function closeLoginModal() {
  document.getElementById('modalLogin').classList.add('hidden');
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const password = document.getElementById('adminPasswordInput').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const json = await res.json();

    if (json.success && json.token) {
      adminToken = json.token;
      sessionStorage.setItem('katalog_admin_token', adminToken);
      updateAdminUI();
      closeLoginModal();
      alert('Berhasil login sebagai Administrator!');
    } else {
      alert(json.message || 'Password admin salah!');
    }
  } catch (err) {
    alert('Koneksi gagal: ' + err.message);
  }
}

function logoutAdmin() {
  if (confirm('Keluar dari mode Administrator?')) {
    adminToken = '';
    sessionStorage.removeItem('katalog_admin_token');
    updateAdminUI();
    const adminActions = document.getElementById('adminProductActions');
    if (adminActions) adminActions.classList.add('hidden');
  }
}

function openAddProductModal() {
  document.getElementById('formModalTitle').textContent = 'Tambah Item Produk Baru (17 Kolom)';
  document.getElementById('formMode').value = 'add';
  document.getElementById('productForm').reset();
  document.getElementById('f_item_code').disabled = false;
  document.getElementById('btnSubmitForm').textContent = 'Tambah Produk';
  document.getElementById('modalProductForm').classList.remove('hidden');
}

function editCurrentProduct() {
  if (!selectedProduct) return;
  const p = selectedProduct;

  document.getElementById('formModalTitle').textContent = `Edit Produk: [${p.item_code}] ${p.official_sku || ''}`;
  document.getElementById('formMode').value = 'edit';

  document.getElementById('f_item_code').value = p.item_code;
  document.getElementById('f_item_code').disabled = true; // code is primary key
  document.getElementById('f_barcode').value = p.barcode || '';
  document.getElementById('f_brand').value = p.brand || '';
  document.getElementById('f_category').value = p.category || '';
  document.getElementById('f_official_sku').value = p.official_sku || '';
  document.getElementById('f_item_alias').value = p.item_alias || '';
  document.getElementById('f_official_name').value = p.official_name || '';
  document.getElementById('f_item_name').value = p.item_name || '';
  document.getElementById('f_main_spec').value = p.main_spec || '';
  document.getElementById('f_detail_spec').value = p.detail_spec || '';
  document.getElementById('f_interface').value = p.interface || '';
  document.getElementById('f_color').value = p.color || '';
  document.getElementById('f_compatibility').value = p.compatibility || '';
  document.getElementById('f_image_url').value = p.image_url || '';
  document.getElementById('f_official_store_url').value = p.official_store_url || '';

  document.getElementById('btnSubmitForm').textContent = 'Simpan Perubahan';
  document.getElementById('modalProductForm').classList.remove('hidden');
}

function closeProductFormModal() {
  document.getElementById('modalProductForm').classList.add('hidden');
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const mode = document.getElementById('formMode').value;
  const itemCode = document.getElementById('f_item_code').value.trim();

  const payload = {
    item_code: itemCode,
    barcode: document.getElementById('f_barcode').value.trim(),
    brand: document.getElementById('f_brand').value.trim(),
    category: document.getElementById('f_category').value.trim(),
    official_sku: document.getElementById('f_official_sku').value.trim(),
    item_alias: document.getElementById('f_item_alias').value.trim(),
    official_name: document.getElementById('f_official_name').value.trim(),
    item_name: document.getElementById('f_item_name').value.trim(),
    main_spec: document.getElementById('f_main_spec').value.trim(),
    detail_spec: document.getElementById('f_detail_spec').value.trim(),
    interface: document.getElementById('f_interface').value.trim(),
    color: document.getElementById('f_color').value.trim(),
    compatibility: document.getElementById('f_compatibility').value.trim(),
    image_url: document.getElementById('f_image_url').value.trim(),
    official_store_url: document.getElementById('f_official_store_url').value.trim(),
    status_data: 'Lengkap'
  };

  const url = mode === 'add' ? '/api/products' : `/api/products/${encodeURIComponent(itemCode)}`;
  const method = mode === 'add' ? 'POST' : 'PUT';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.success) {
      alert(json.message);
      closeProductFormModal();
      closeProductDetailModal();
      loadProducts();
    } else {
      alert(json.message || 'Gagal menyimpan produk.');
    }
  } catch (err) {
    alert('Terjadi kesalahan: ' + err.message);
  }
}

async function deleteCurrentProduct() {
  if (!selectedProduct) return;
  const p = selectedProduct;

  if (confirm(`Apakah Anda yakin ingin menghapus produk [${p.item_code}] ${p.official_name}?`)) {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(p.item_code)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        closeProductDetailModal();
        loadProducts();
      } else {
        alert(json.message || 'Gagal menghapus produk.');
      }
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    }
  }
}

// -------------------------------------------------------------
// LIVE STOCK SYNC TRIGGER
// -------------------------------------------------------------
async function triggerStockSync() {
  const icon = document.getElementById('syncIcon');
  if (icon) icon.classList.add('spin');

  try {
    const res = await fetch('/api/sync-stock', { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      alert(`Sinkronisasi berhasil! Data stok terbaru tanggal ${json.reportDate} siap digunakan.`);
      document.getElementById('syncDateLabel').textContent = `Laporan Stok Tanggal: ${json.reportDate}`;
      loadProducts();
    } else {
      alert('Gagal sinkronisasi stok: ' + json.message);
    }
  } catch (err) {
    alert('Gagal menghubungi server: ' + err.message);
  } finally {
    if (icon) icon.classList.remove('spin');
  }
}

// Helper backdrop close
function closeModalOnBackdrop(e, modalId) {
  if (e.target.id === modalId) {
    document.getElementById(modalId).classList.add('hidden');
  }
}

// Simple HTML escaper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
