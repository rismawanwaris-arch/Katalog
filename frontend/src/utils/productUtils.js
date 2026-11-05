// Brand Color Themes
export function getBrandTheme(brand) {
  const b = (brand || '').toUpperCase().trim();
  const themes = {
    'VENTION': { bg1: '#0284c7', bg2: '#0369a1', light: '#e0f2fe', tag: 'bg-sky-50 text-sky-700 border-sky-200' },
    'UGREEN': { bg1: '#059669', bg2: '#047857', light: '#d1fae5', tag: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'ROBOT': { bg1: '#ea580c', bg2: '#c2410c', light: '#ffedd5', tag: 'bg-orange-50 text-orange-700 border-orange-200' },
    'VIVAN': { bg1: '#d97706', bg2: '#b45309', light: '#fef3c7', tag: 'bg-amber-50 text-amber-700 border-amber-200' },
    'REXI': { bg1: '#9333ea', bg2: '#7e22ce', light: '#f3e8ff', tag: 'bg-purple-50 text-purple-700 border-purple-200' },
    'IPHONE': { bg1: '#334155', bg2: '#1e293b', light: '#f1f5f9', tag: 'bg-slate-100 text-slate-800 border-slate-300' },
    'SAMSUNG': { bg1: '#4338ca', bg2: '#3730a3', light: '#e0e7ff', tag: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    'INFINIX': { bg1: '#10b981', bg2: '#059669', light: '#ecfdf5', tag: 'bg-teal-50 text-teal-700 border-teal-200' },
    'FOOMEE': { bg1: '#e11d48', bg2: '#be123c', light: '#ffe4e6', tag: 'bg-rose-50 text-rose-700 border-rose-200' },
    'UFONE': { bg1: '#16a34a', bg2: '#15803d', light: '#dcfce7', tag: 'bg-green-50 text-green-700 border-green-200' },
    'OPPO': { bg1: '#047857', bg2: '#065f46', light: '#d1fae5', tag: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    'VIVO': { bg1: '#2563eb', bg2: '#1d4ed8', light: '#dbeafe', tag: 'bg-blue-50 text-blue-700 border-blue-200' }
  };
  return themes[b] || { bg1: '#1F4E79', bg2: '#163857', light: '#e8f0fe', tag: 'bg-blue-50 text-blue-900 border-blue-200' };
}

// Category Icon SVG
export function getCategoryIconSvg(category) {
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

// Generate SVG Vector Placeholder
export function getProductPlaceholderSrc(brand, category, itemCode) {
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
    <text x="200" y="225" fill="${t.bg2}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="700" text-anchor="middle">KODE: ${cleanCode}</text>
    <text x="200" y="245" fill="#64748b" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="11" text-anchor="middle">Produk Resmi &amp; Bergaransi</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Get Image Source with Smart Fallback
export function getProductImageSrc(product) {
  if (product.image_url && !product.image_url.includes('images.tokopedia.net') && !product.image_url.includes('placehold.co')) {
    return product.image_url;
  }
  return getProductPlaceholderSrc(product.brand, product.category, product.item_code);
}

// Get All Gallery Images with Fallback
export function getProductGalleryImages(product) {
  if (!product) return [];
  let images = [];
  if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
    images = product.gallery_images.filter(img => img && !img.includes('images.tokopedia.net') && !img.includes('placehold.co'));
  }
  if (images.length === 0 && product.image_url && !product.image_url.includes('images.tokopedia.net') && !product.image_url.includes('placehold.co')) {
    images = [product.image_url];
  }
  if (images.length === 0) {
    images = [getProductPlaceholderSrc(product.brand, product.category, product.item_code)];
  }
  return images;
}

// Format Rupiah Currency
export function formatRupiah(amount) {
  if (!amount || isNaN(amount) || amount <= 0) {
    return 'Rp -';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
