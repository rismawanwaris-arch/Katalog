/**
 * Katalog Aksesoris & Produk Knowledge Web Server
 * Integrates directly with LaporanStcok API
 * Manages 17-column product catalog and real-time per-outlet stock.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { DatabaseSync } = require('node:sqlite');
const ExcelJS = require('exceljs');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const PORT = parseInt(process.env.PORT, 10) || parseInt(process.env.CATALOG_PORT, 10) || 3600;
const HOST = process.env.CATALOG_HOST || '0.0.0.0';
let dbPath = process.env.CATALOG_DB_PATH || path.join(__dirname, 'catalog.db');
// Safety guard: if Docker auto-created a directory because the file didn't exist yet on host
if (fs.existsSync(dbPath) && fs.statSync(dbPath).isDirectory()) {
  dbPath = path.join(dbPath, 'catalog.db');
}
const db = new DatabaseSync(dbPath);

// Initialize settings table
db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);`);

// Initialize products table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_no INTEGER,
    item_code TEXT UNIQUE NOT NULL,
    item_name TEXT NOT NULL,
    item_alias TEXT,
    barcode TEXT,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    official_sku TEXT,
    official_name TEXT NOT NULL,
    main_spec TEXT,
    detail_spec TEXT,
    interface TEXT,
    compatibility TEXT,
    color TEXT,
    image_url TEXT,
    official_store_url TEXT,
    price INTEGER DEFAULT 0,
    status_data TEXT DEFAULT 'Lengkap',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Auto-migrate price column if missing in existing database
try {
  const pragma = db.prepare('PRAGMA table_info(products)').all();
  const hasPrice = pragma.some(c => c.name === 'price');
  if (!hasPrice) {
    db.exec('ALTER TABLE products ADD COLUMN price INTEGER DEFAULT 0;');
    console.log('[Database] Kolom "price" berhasil ditambahkan ke tabel products.');
  }
} catch (e) {
  console.error('[Database] Error checking/adding price column:', e.message);
}

// Initialize users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'KASIR',
    assigned_outlet TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    last_login TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Seed initial users if empty
try {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount === 0) {
    const now = new Date().toISOString();
    const initAdminPass = process.env.ADMIN_PASSWORD || 'admin';
    const initKasirPass = process.env.DEFAULT_USER_PASSWORD || 'kasir';
    db.prepare(`
      INSERT INTO users (username, password, full_name, role, assigned_outlet, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('admin', initAdminPass, 'Administrator Utama', 'SUPERADMIN', '', 'ACTIVE', now, now);

    db.prepare(`
      INSERT INTO users (username, password, full_name, role, assigned_outlet, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('kasir_alfa7', initKasirPass, 'Kasir Alfa 7', 'KASIR', 'ALFA 7', 'ACTIVE', now, now);

    db.prepare(`
      INSERT INTO users (username, password, full_name, role, assigned_outlet, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('spv_suci', initKasirPass, 'Kepala Toko Suci', 'SUPERVISOR', 'SUCI', 'ACTIVE', now, now);
  }
} catch (e) {
  console.error('Error seeding users:', e);
}

// Initialize activity_logs table
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    full_name TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL
  );
`);

function logActivity(username, fullName, action, module, description, details = null, req = null) {
  try {
    let ip = '';
    if (req) {
      ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
    }
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO activity_logs (username, full_name, action, module, description, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      username || 'system',
      fullName || username || 'Sistem',
      action,
      module,
      description,
      details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null,
      ip,
      now
    );
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

// Seed initial log if empty
try {
  const logCount = db.prepare('SELECT count(*) as count FROM activity_logs').get().count;
  if (logCount === 0) {
    logActivity('system', 'Sistem Katalog', 'SYSTEM_INIT', 'SYSTEM', 'Sistem katalog dan database SQLite berhasil diinisialisasi.');
    logActivity('admin', 'Administrator Utama', 'USER_CREATE', 'USERS', 'Akun Superadmin default berhasil dibuat.');
  }
} catch (e) {}

// Helper to normalize and simplify cable and charger categories automatically
function normalizeProductCategory(p) {
  const currentCat = p.category || '';
  const nameUpper = (p.item_name || '').toUpperCase();
  const offUpper = (p.official_name || '').toUpperCase();
  const specUpper = (p.main_spec || '').toUpperCase();
  const ifaceUpper = (p.interface || '').toUpperCase();
  const fullText = `${nameUpper} ${offUpper} ${specUpper} ${ifaceUpper} ${currentCat}`.toUpperCase();

  const isChargerContext = currentCat.includes('Charger') || currentCat.includes('Batok') || 
                           nameUpper.startsWith('BATOK') || nameUpper.startsWith('CHARGER') || 
                           nameUpper.startsWith('CAR CRGR') || nameUpper.startsWith('CAR CHARGER');

  if (isChargerContext) {
    if (nameUpper.includes('CAR CHARGER') || nameUpper.includes('CAR CRGR') || currentCat.includes('Car Charger')) {
      return 'Car Charger (Mobil)';
    }

    if (/\bGAN\b/.test(fullText)) {
      return 'Charger GaN (Teknologi GaN)';
    }

    const isSet = currentCat.includes('Set') || nameUpper.includes('SET') || offUpper.includes('SET') || 
                  offUpper.includes('WITH') || specUpper.includes('TERMASUK KABEL') || specUpper.includes('PAKET BUNDLING');
    if (isSet) {
      if (fullText.includes('1.5A') || fullText.includes('7.5W') || nameUpper.includes('CQ15')) {
        return 'Charger Set 1.5A (Standar)';
      }
      return 'Charger Set 2.4A / Fast Charging';
    }

    if ((fullText.includes('1.5A') || fullText.includes('7.5W') || nameUpper.includes('CH002') || nameUpper.includes('BF15') || nameUpper.includes('TC01')) && 
        !nameUpper.includes('3A') && !fullText.includes('18W')) {
      return 'Batok Charger 1.5A (Standar)';
    }
    return 'Batok Fast Charger (2.4A - 3A / PD)';
  }

  const isExcludedCable = fullText.includes('HDMI') || fullText.includes('LAN') || fullText.includes('CONVERTER') || 
                          fullText.includes('PRINTER') || fullText.includes('AUX') || nameUpper.includes('MALE TO MALE') || 
                          nameUpper.includes('MINI-B');

  const isCableContext = (currentCat.includes('Kabel Data') || currentCat.includes('Kabel Toples') || 
                          currentCat.includes('Kabel Flex') || currentCat.includes('Kabel Braided') || 
                          currentCat.includes('Kabel Tebal') || nameUpper.startsWith('KABEL DATA') || 
                          p.item_code === '004012') && !isExcludedCable;

  if (isCableContext) {
    if (nameUpper.includes('3 IN 1') || nameUpper.includes('3IN1') || nameUpper.includes('4 IN 1') || nameUpper.includes('4IN1') || nameUpper.includes('TRIPLE')) {
      return 'Kabel Data Multi (3-in-1)';
    }
    if (nameUpper.includes('C TO C') || nameUpper.includes('C-TO-C') || offUpper.includes('C TO C') || 
        offUpper.includes('TYPE-C TO TYPE-C') || offUpper.includes('USB-C TO USB-C') || 
        nameUpper.includes('CB01-CC') || nameUpper.includes('TB01-CC') || nameUpper.includes('CC 100W') || 
        ifaceUpper === 'USB TYPE-C TO TYPE-C') {
      return 'Kabel Data C to C';
    }
    if (nameUpper.includes('C TO L') || nameUpper.includes('C-TO-L') || offUpper.includes('C TO L') || 
        offUpper.includes('C TO LIGHTNING') || offUpper.includes('TYPE-C TO LIGHTNING') || 
        nameUpper.includes('CB01-CL') || nameUpper.includes('TB01-CL') || nameUpper.includes('C-L')) {
      return 'Kabel Data C to L';
    }
    if (/LIGHT(N)?ING/.test(fullText) || nameUpper.includes('IPHONE') || nameUpper.includes('IPH') || 
        nameUpper.includes('TO L') || nameUpper.includes('DGL') || nameUpper.includes('KA02-L') || 
        nameUpper.includes('CSL100') || nameUpper.includes('RGL100')) {
      return 'Kabel Data Lightning';
    }
    if (nameUpper.includes('MICRO') || nameUpper.includes('MIKRO') || nameUpper.includes('V8') || 
        nameUpper.includes('TO M') || nameUpper.includes('TOPLES M') || nameUpper.includes('DGM') || 
        nameUpper.includes('KA02-M') || nameUpper.includes('CSM100') || nameUpper.includes('RBM100')) {
      return 'Kabel Data Micro';
    }
    if (nameUpper.includes('TYPE C') || nameUpper.includes('TYPE-C') || nameUpper.includes('USB-C') || 
        nameUpper.includes('USB TO C') || nameUpper.includes('DGC') || nameUpper.includes('KA02-C') || 
        nameUpper.includes('CBC100S')) {
      return 'Kabel Data Type-C';
    }
    return 'Kabel Data Lainnya';
  }

  return currentCat;
}

// Auto-migrate legacy cable and charger categories on startup
try {
  const legacyRows = db.prepare(`
    SELECT id, item_code, item_name, official_name, main_spec, interface, category 
    FROM products 
    WHERE category LIKE '%Kabel Data%' OR category LIKE '%Kabel Toples%' OR category LIKE '%Kabel Flex%' 
       OR category LIKE '%Kabel Braided%' OR category LIKE '%Batok%' OR category LIKE '%Charger%'
  `).all();

  if (legacyRows && legacyRows.length > 0) {
    const updateCatStmt = db.prepare('UPDATE products SET category = ? WHERE id = ?');
    legacyRows.forEach(row => {
      const simplified = normalizeProductCategory(row);
      if (simplified !== row.category) {
        updateCatStmt.run(simplified, row.id);
      }
    });
  }
} catch (e) {}

function getSetting(key, defaultVal) {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setSetting(key, val) {
  try {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(val));
  } catch (e) {
    console.error('Error saving setting:', e);
  }
}

let STOCK_API_URL = getSetting('stock_api_url', process.env.STOCK_API_URL || 'http://localhost:3500');
let ADMIN_PASSWORD = getSetting('admin_password', process.env.ADMIN_PASSWORD || 'admin');

// In-memory stock cache: stockCache[itemCode][outletName] = qty
let stockCache = {};
let allOutletsList = [];
let lastStockSyncTime = null;
let lastStockReportDate = null;

/**
 * Fetches stock from LaporanStcok API and caches it.
 */
async function syncStockFromAPI() {
  return new Promise((resolve) => {
    console.log(`[Stock Sync] Menghubungi API Stok di ${STOCK_API_URL}/api/dates ...`);
    
    // First, find the latest date
    http.get(`${STOCK_API_URL}/api/dates`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.success || !json.dates || json.dates.length === 0) {
            console.warn('[Stock Sync] Gagal mendapatkan tanggal laporan stok.');
            return resolve(false);
          }

          const latestDate = json.dates[0].report_date;
          console.log(`[Stock Sync] Mengunduh laporan stok terbaru tanggal: ${latestDate} ...`);

          http.get(`${STOCK_API_URL}/api/stock?date=${latestDate}`, (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => {
              try {
                const stockJson = JSON.parse(data2);
                if (!stockJson.success || !stockJson.report) {
                  console.warn('[Stock Sync] Gagal mem-parse data stok dari server.');
                  return resolve(false);
                }

                const rData = typeof stockJson.report.data === 'string'
                  ? JSON.parse(stockJson.report.data)
                  : stockJson.report.data;

                allOutletsList = rData.allOutlets || [];
                const newStockMap = {};

                if (rData.merks) {
                  Object.values(rData.merks).forEach(m => {
                    if (m.items) {
                      Object.values(m.items).forEach(it => {
                        newStockMap[it.code] = it.stocks || {};
                      });
                    }
                  });
                }

                stockCache = newStockMap;
                lastStockReportDate = latestDate;
                lastStockSyncTime = new Date().toISOString();
                console.log(`[Stock Sync] Sukses! Sinkronisasi ${Object.keys(stockCache).length} item di ${allOutletsList.length} outlet (Tanggal: ${latestDate})`);
                resolve(true);
              } catch (err) {
                console.error('[Stock Sync] Error parsing stock detail:', err.message);
                resolve(false);
              }
            });
          }).on('error', (err) => {
            console.error('[Stock Sync] Error fetching stock detail:', err.message);
            resolve(false);
          });

        } catch (err) {
          console.error('[Stock Sync] Error parsing dates:', err.message);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error('[Stock Sync] Koneksi ke server stok gagal:', err.message);
      resolve(false);
    });
  });
}

// Initial sync
syncStockFromAPI();
// Auto re-sync every 10 minutes
setInterval(syncStockFromAPI, 10 * 60 * 1000);

// Helper for sending JSON responses
function sendJson(req, res, statusCode, data) {
  const jsonStr = JSON.stringify(data);
  const acceptEncoding = req.headers['accept-encoding'] || '';

  if (acceptEncoding.includes('gzip')) {
    zlib.gzip(jsonStr, (err, compressed) => {
      if (err) {
        res.writeHead(statusCode, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(jsonStr),
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(jsonStr);
      }
      res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'gzip',
        'Content-Length': compressed.length,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(compressed);
    });
  } else {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(jsonStr),
      'Access-Control-Allow-Origin': '*'
    });
    res.end(jsonStr);
  }
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) { // 25MB limit for Excel import payloads
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Static MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // -----------------------------------------------------------------
  // API ROUTES
  // -----------------------------------------------------------------

  // 1. GET /api/outlets
  if (req.method === 'GET' && pathname === '/api/outlets') {
    return sendJson(req, res, 200, {
      success: true,
      outlets: allOutletsList,
      lastSync: lastStockSyncTime,
      reportDate: lastStockReportDate
    });
  }

  // 2. GET /api/sync-stock
  if (req.method === 'POST' && pathname === '/api/sync-stock') {
    const ok = await syncStockFromAPI();
    if (ok) {
      logActivity('admin', 'Administrator', 'STOCK_SYNC', 'STOK', `Sinkronisasi stok manual berhasil: ${Object.keys(stockCache).length} item di ${allOutletsList.length} cabang (Tanggal: ${lastStockReportDate})`, null, req);
    }
    return sendJson(req, res, ok ? 200 : 500, {
      success: ok,
      message: ok ? 'Stok berhasil disinkronkan' : 'Gagal sinkronisasi stok',
      lastSync: lastStockSyncTime,
      reportDate: lastStockReportDate,
      totalItemsInStock: Object.keys(stockCache).length
    });
  }

  // 3. GET /api/products
  if (req.method === 'GET' && pathname === '/api/products') {
    try {
      const search = (parsedUrl.searchParams.get('q') || '').trim().toLowerCase();
      const brand = (parsedUrl.searchParams.get('brand') || '').trim();
      const category = (parsedUrl.searchParams.get('category') || '').trim();
      const selectedOutlet = (parsedUrl.searchParams.get('outlet') || '').trim();
      const onlyReady = parsedUrl.searchParams.get('ready') === 'true';

      let sql = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (brand && brand !== 'ALL') {
        sql += ' AND brand = ?';
        params.push(brand);
      }

      if (category && category !== 'ALL') {
        sql += ' AND category = ?';
        params.push(category);
      }

      if (search) {
        sql += ` AND (
          LOWER(item_code) LIKE ? OR
          LOWER(item_name) LIKE ? OR
          LOWER(barcode) LIKE ? OR
          LOWER(official_sku) LIKE ? OR
          LOWER(official_name) LIKE ? OR
          LOWER(main_spec) LIKE ? OR
          LOWER(detail_spec) LIKE ? OR
          LOWER(compatibility) LIKE ?
        )`;
        const qPattern = `%${search}%`;
        for (let i = 0; i < 8; i++) params.push(qPattern);
      }

      sql += ' ORDER BY item_no ASC';

      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);

      // Attach real-time stock
      const products = rows.map(p => {
        const itemStocks = stockCache[p.item_code] || {};
        let outletStock = 0;
        let totalNetworkStock = 0;
        const otherOutlets = [];

        Object.entries(itemStocks).forEach(([outName, qty]) => {
          const num = parseInt(qty, 10) || 0;
          totalNetworkStock += num;
          if (selectedOutlet && outName === selectedOutlet) {
            outletStock = num;
          } else if (num > 0) {
            otherOutlets.push({ outlet: outName, stock: num });
          }
        });

        // Sort other outlets by stock descending
        otherOutlets.sort((a, b) => b.stock - a.stock);

        // Check if local image exists in public/images/products/
        const localJpg = path.join(__dirname, 'public', 'images', 'products', `${p.item_code}.jpg`);
        const localPng = path.join(__dirname, 'public', 'images', 'products', `${p.item_code}.png`);
        const localWebp = path.join(__dirname, 'public', 'images', 'products', `${p.item_code}.webp`);
        let finalImage = '';
        if (fs.existsSync(localJpg)) {
          finalImage = `/images/products/${p.item_code}.jpg`;
        } else if (fs.existsSync(localPng)) {
          finalImage = `/images/products/${p.item_code}.png`;
        } else if (fs.existsSync(localWebp)) {
          finalImage = `/images/products/${p.item_code}.webp`;
        } else if (p.image_url && !p.image_url.includes('images.tokopedia.net')) {
          finalImage = p.image_url;
        }

        return {
          ...p,
          image_url: finalImage,
          outletStock,
          hasStockInOutlet: outletStock > 0,
          totalNetworkStock,
          otherOutletsWithStock: otherOutlets.slice(0, 5) // top 5
        };
      });

      // Filter only ready if requested
      const filtered = onlyReady
        ? (selectedOutlet ? products.filter(p => p.outletStock > 0) : products.filter(p => p.totalNetworkStock > 0))
        : products;

      // Extract unique brands & categories for filter UI
      const brands = db.prepare('SELECT DISTINCT brand FROM products ORDER BY brand ASC').all().map(r => r.brand);
      const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category ASC').all().map(r => r.category);

      return sendJson(req, res, 200, {
        success: true,
        total: filtered.length,
        selectedOutlet,
        reportDate: lastStockReportDate,
        lastStockSync: lastStockSyncTime,
        brands,
        categories,
        products: filtered
      });
    } catch (err) {
      console.error('Error fetching products:', err);
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 4. GET /api/products/:code
  if (req.method === 'GET' && pathname.startsWith('/api/products/')) {
    const code = decodeURIComponent(pathname.replace('/api/products/', ''));
    const selectedOutlet = (parsedUrl.searchParams.get('outlet') || '').trim();

    const product = db.prepare('SELECT * FROM products WHERE item_code = ?').get(code);
    if (!product) {
      return sendJson(req, res, 404, { success: false, message: 'Produk tidak ditemukan' });
    }

    const itemStocks = stockCache[product.item_code] || {};
    let outletStock = 0;
    let totalNetworkStock = 0;
    const allOutletsBreakdown = [];

    allOutletsList.forEach(outName => {
      const num = parseInt(itemStocks[outName], 10) || 0;
      totalNetworkStock += num;
      if (selectedOutlet && outName === selectedOutlet) {
        outletStock = num;
      }
      allOutletsBreakdown.push({ outlet: outName, stock: num });
    });

    // Sort breakdown: outlets with stock first
    allOutletsBreakdown.sort((a, b) => b.stock - a.stock);

    // Check local image
    const localJpg = path.join(__dirname, 'public', 'images', 'products', `${product.item_code}.jpg`);
    const localPng = path.join(__dirname, 'public', 'images', 'products', `${product.item_code}.png`);
    const localWebp = path.join(__dirname, 'public', 'images', 'products', `${product.item_code}.webp`);
    let finalImage = '';
    if (fs.existsSync(localJpg)) {
      finalImage = `/images/products/${product.item_code}.jpg`;
    } else if (fs.existsSync(localPng)) {
      finalImage = `/images/products/${product.item_code}.png`;
    } else if (fs.existsSync(localWebp)) {
      finalImage = `/images/products/${product.item_code}.webp`;
    } else if (product.image_url && !product.image_url.includes('images.tokopedia.net')) {
      finalImage = product.image_url;
    }

    return sendJson(req, res, 200, {
      success: true,
      product: {
        ...product,
        image_url: finalImage,
        selectedOutlet,
        outletStock,
        hasStockInOutlet: outletStock > 0,
        totalNetworkStock,
        allOutletsBreakdown,
        reportDate: lastStockReportDate
      }
    });
  }

  // 5. POST /api/admin/login
  if (req.method === 'POST' && pathname === '/api/admin/login') {
    try {
      const body = await parseJsonBody(req);
      const password = body.password || '';
      // Verify admin password
      if (password === ADMIN_PASSWORD) {
        logActivity('admin', 'Administrator Utama', 'LOGIN', 'AUTH', 'Login berhasil ke Panel Administrator.', null, req);
        return sendJson(req, res, 200, {
          success: true,
          token: 'auth-token-admin-' + Date.now(),
          message: 'Login berhasil sebagai Administrator'
        });
      } else {
        logActivity('unknown', 'Anonim', 'LOGIN_FAILED', 'AUTH', 'Percobaan login admin gagal: password salah.', null, req);
        return sendJson(req, res, 401, {
          success: false,
          message: 'Password admin salah!'
        });
      }
    } catch (err) {
      return sendJson(req, res, 400, { success: false, message: err.message });
    }
  }

  // 6. POST /api/products (Admin Create)
  if (req.method === 'POST' && pathname === '/api/products') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Akses ditolak. Silakan login sebagai Admin.' });
      }

      const b = await parseJsonBody(req);
      if (!b.item_code || !b.official_name) {
        return sendJson(req, res, 400, { success: false, message: 'Kode Item dan Nama Produk Resmi wajib diisi.' });
      }

      // Find max item_no
      const maxNoRow = db.prepare('SELECT MAX(item_no) as maxNo FROM products').get();
      const nextNo = (maxNoRow.maxNo || 0) + 1;
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO products (
          item_no, item_code, item_name, item_alias, barcode,
          brand, category, official_sku, official_name,
          main_spec, detail_spec, interface, compatibility,
          color, image_url, official_store_url, price, status_data,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?
        )
      `);

      const priceVal = parseInt(b.price, 10) || 0;

      stmt.run(
        nextNo,
        b.item_code.trim(),
        b.item_name || b.official_name,
        b.item_alias || '',
        b.barcode || '',
        b.brand || 'CAMPURAN',
        b.category || 'Aksesoris',
        b.official_sku || b.item_code,
        b.official_name.trim(),
        b.main_spec || '',
        b.detail_spec || '',
        b.interface || '',
        b.compatibility || '',
        b.color || '',
        b.image_url || '',
        b.official_store_url || '',
        priceVal,
        b.status_data || 'Lengkap',
        now,
        now
      );

      logActivity('admin', 'Administrator Utama', 'ITEM_CREATE', 'CATALOG', `Menambahkan produk baru [${b.item_code}] - ${b.official_name}`, { code: b.item_code, brand: b.brand }, req);

      return sendJson(req, res, 201, {
        success: true,
        message: `Produk [${b.item_code}] berhasil ditambahkan ke katalog.`
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 7. PUT /api/products/:code (Admin Edit)
  if (req.method === 'PUT' && pathname.startsWith('/api/products/')) {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Akses ditolak. Silakan login sebagai Admin.' });
      }

      const code = decodeURIComponent(pathname.replace('/api/products/', ''));
      const b = await parseJsonBody(req);
      const now = new Date().toISOString();
      const priceVal = parseInt(b.price, 10) || 0;

      const stmt = db.prepare(`
        UPDATE products SET
          item_name = ?, item_alias = ?, barcode = ?,
          brand = ?, category = ?, official_sku = ?, official_name = ?,
          main_spec = ?, detail_spec = ?, interface = ?, compatibility = ?,
          color = ?, image_url = ?, official_store_url = ?, price = ?, status_data = ?,
          updated_at = ?
        WHERE item_code = ?
      `);

      stmt.run(
        b.item_name, b.item_alias, b.barcode,
        b.brand, b.category, b.official_sku, b.official_name,
        b.main_spec, b.detail_spec, b.interface, b.compatibility,
        b.color, b.image_url, b.official_store_url, priceVal, b.status_data,
        now,
        code
      );

      logActivity('admin', 'Administrator Utama', 'ITEM_UPDATE', 'CATALOG', `Memperbarui spesifikasi produk [${code}] - ${b.official_name}`, { code, brand: b.brand }, req);

      return sendJson(req, res, 200, {
        success: true,
        message: `Produk [${code}] berhasil diperbarui.`
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 8. DELETE /api/products/:code (Admin Delete)
  if (req.method === 'DELETE' && pathname.startsWith('/api/products/')) {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Akses ditolak. Silakan login sebagai Admin.' });
      }

      const code = decodeURIComponent(pathname.replace('/api/products/', ''));
      db.prepare('DELETE FROM products WHERE item_code = ?').run(code);

      logActivity('admin', 'Administrator Utama', 'ITEM_DELETE', 'CATALOG', `Menghapus produk [${code}] dari katalog database`, { code }, req);

      return sendJson(req, res, 200, {
        success: true,
        message: `Produk [${code}] berhasil dihapus.`
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 8b. POST /api/admin/products/bulk-delete (Bulk Delete Multiple Products)
  if (req.method === 'POST' && pathname === '/api/admin/products/bulk-delete') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Akses ditolak. Silakan login sebagai Admin.' });
      }

      const body = await parseJsonBody(req);
      const { codes } = body;
      if (!Array.isArray(codes) || codes.length === 0) {
        return sendJson(req, res, 400, { success: false, message: 'Daftar kode item wajib disertakan!' });
      }

      const placeholders = codes.map(() => '?').join(',');
      db.prepare(`DELETE FROM products WHERE item_code IN (${placeholders})`).run(...codes);

      logActivity('admin', 'Administrator Utama', 'ITEM_BULK_DELETE', 'CATALOG', `Menghapus massal ${codes.length} produk dari katalog database`, { count: codes.length, codes }, req);

      return sendJson(req, res, 200, {
        success: true,
        count: codes.length,
        message: `Berhasil menghapus ${codes.length} produk yang dipilih.`
      });
    } catch (err) {
      console.error('Error in bulk-delete:', err);
      return sendJson(req, res, 500, { success: false, message: 'Gagal menghapus produk massal: ' + err.message });
    }
  }

  // POST /api/admin/upload-image (Direct photo upload for product)
  if (req.method === 'POST' && pathname === '/api/admin/upload-image') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Akses ditolak. Silakan login sebagai Admin.' });
      }

      const body = await parseJsonBody(req);
      const { imageBase64, fileName, itemCode } = body;

      if (!imageBase64) {
        return sendJson(req, res, 400, { success: false, message: 'File gambar (base64) wajib disertakan!' });
      }

      // Determine extension
      let ext = '.jpg';
      if (imageBase64.startsWith('data:image/png')) ext = '.png';
      else if (imageBase64.startsWith('data:image/webp')) ext = '.webp';
      else if (imageBase64.startsWith('data:image/gif')) ext = '.gif';
      else if (fileName) {
        const fileExt = path.extname(fileName).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExt)) {
          ext = fileExt === '.jpeg' ? '.jpg' : fileExt;
        }
      }

      const uploadDir = path.join(__dirname, 'public', 'images', 'products');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const cleanCode = (itemCode || 'prod').replace(/[^a-zA-Z0-9_-]/g, '');
      const uniqueFileName = `${cleanCode}_${Date.now()}${ext}`;
      const destPath = path.join(uploadDir, uniqueFileName);

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      fs.writeFileSync(destPath, buffer);

      const publicImageUrl = `/images/products/${uniqueFileName}`;

      // If itemCode was provided and product exists in database, auto-update image_url
      if (itemCode) {
        const now = new Date().toISOString();
        db.prepare('UPDATE products SET image_url = ?, updated_at = ? WHERE item_code = ?').run(publicImageUrl, now, itemCode);
        logActivity('admin', 'Administrator Utama', 'IMAGE_UPLOAD', 'CATALOG', `Mengunggah foto produk langsung untuk [${itemCode}]`, { itemCode, file: uniqueFileName }, req);
      }

      return sendJson(req, res, 200, {
        success: true,
        imageUrl: publicImageUrl,
        message: 'Foto berhasil diunggah dan disimpan ke server!'
      });
    } catch (err) {
      console.error('Error uploading image:', err);
      return sendJson(req, res, 500, { success: false, message: 'Gagal mengunggah foto: ' + err.message });
    }
  }

  // Helper to parse products from uploaded Excel buffer
  async function parseExcelProducts(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('File Excel tidak memiliki lembar kerja (worksheet)!');
    }

    // Identify columns from Header row (row 1)
    const headerRow = worksheet.getRow(1);
    const colMap = {};
    headerRow.eachCell((cell, colNumber) => {
      const val = (cell.value || '').toString().toLowerCase().trim();
      if (val.includes('kode')) colMap.item_code = colNumber;
      else if (val.includes('toko') || val.includes('marketplace') || val.includes('store') || val.includes('link')) colMap.official_store_url = colNumber;
      else if ((val.includes('nama') && val.includes('official')) || (val.includes('nama') && val.includes('lengkap')) || (val.includes('resmi') && val.includes('nama')) || val.includes('nama produk')) colMap.official_name = colNumber;
      else if (val.includes('pos') || val.includes('erp') || val.includes('nama item')) colMap.item_name = colNumber;
      else if (val.includes('alias')) colMap.item_alias = colNumber;
      else if (val.includes('barcode') || val.includes('ean')) colMap.barcode = colNumber;
      else if (val.includes('merk') || val.includes('brand')) colMap.brand = colNumber;
      else if (val.includes('kategori') || val.includes('category')) colMap.category = colNumber;
      else if (val.includes('sku') || val.includes('model')) colMap.official_sku = colNumber;
      else if (val.includes('utama')) colMap.main_spec = colNumber;
      else if (val.includes('detail') || val.includes('fitur')) colMap.detail_spec = colNumber;
      else if (val.includes('konektor') || val.includes('interface')) colMap.interface = colNumber;
      else if (val.includes('kompatib') || val.includes('compatibility')) colMap.compatibility = colNumber;
      else if (val.includes('warna') || val.includes('color')) colMap.color = colNumber;
      else if (val.includes('gambar') || val.includes('image') || val.includes('foto')) colMap.image_url = colNumber;
      else if (val.includes('harga') || val.includes('price') || val.includes('tarif')) colMap.price = colNumber;
      else if (val.includes('status') || val.includes('kelengkapan')) colMap.status_data = colNumber;
    });

    // Default column index fallbacks (17-column format: 1:No, 2:Code, 3:POS Name, ..., 9:Official Name)
    if (!colMap.item_code) colMap.item_code = 2;
    if (!colMap.official_name) colMap.official_name = 9;
    if (!colMap.item_name) colMap.item_name = 3;
    if (!colMap.item_alias) colMap.item_alias = 4;
    if (!colMap.barcode) colMap.barcode = 5;
    if (!colMap.brand) colMap.brand = 6;
    if (!colMap.category) colMap.category = 7;
    if (!colMap.official_sku) colMap.official_sku = 8;
    if (!colMap.main_spec) colMap.main_spec = 10;
    if (!colMap.detail_spec) colMap.detail_spec = 11;
    if (!colMap.interface) colMap.interface = 12;
    if (!colMap.compatibility) colMap.compatibility = 13;
    if (!colMap.color) colMap.color = 14;
    if (!colMap.image_url) colMap.image_url = 15;
    if (!colMap.official_store_url) colMap.official_store_url = 16;
    if (!colMap.status_data) colMap.status_data = 17;

    function getCellText(row, colIndex) {
      if (!colIndex) return '';
      const cell = row.getCell(colIndex);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object') {
        if (cell.value.hyperlink) return String(cell.value.hyperlink).trim();
        if (cell.value.text) return String(cell.value.text).trim();
        if (cell.value.result) return String(cell.value.result).trim();
        return String(cell.text || '').trim();
      }
      return String(cell.value).trim();
    }

    const items = [];
    const errors = [];

    for (let r = 2; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      let hasAnyData = false;
      row.eachCell(() => { hasAnyData = true; });
      if (!hasAnyData) continue;

      const item_code = getCellText(row, colMap.item_code);
      const official_name = getCellText(row, colMap.official_name);

      if (!item_code && !official_name) continue;

      if (!item_code) {
        errors.push({ row: r, message: `Baris ${r}: 'Kode Item' tidak boleh kosong!` });
        continue;
      }
      if (!official_name) {
        errors.push({ row: r, code: item_code, message: `Baris ${r} [${item_code}]: 'Nama Produk Resmi' tidak boleh kosong!` });
        continue;
      }

      const item_name = getCellText(row, colMap.item_name) || official_name;
      const item_alias = getCellText(row, colMap.item_alias);
      const barcode = getCellText(row, colMap.barcode);
      const brand = (getCellText(row, colMap.brand) || 'CAMPURAN').toUpperCase();
      const rawCategory = getCellText(row, colMap.category) || 'Aksesoris';
      const official_sku = getCellText(row, colMap.official_sku) || item_code;
      const main_spec = getCellText(row, colMap.main_spec);
      const detail_spec = getCellText(row, colMap.detail_spec);
      const iface = getCellText(row, colMap.interface);
      const compatibility = getCellText(row, colMap.compatibility);
      const color = getCellText(row, colMap.color);
      const image_url = getCellText(row, colMap.image_url);
      const official_store_url = getCellText(row, colMap.official_store_url);
      const status_data = getCellText(row, colMap.status_data) || 'Lengkap';
      const rawPrice = colMap.price ? getCellText(row, colMap.price) : '';
      let price = 0;
      if (rawPrice) {
        price = parseInt(String(rawPrice).replace(/[^0-9]/g, ''), 10) || 0;
      }

      const category = normalizeProductCategory({
        item_name,
        official_name,
        main_spec,
        interface: iface,
        category: rawCategory
      });

      items.push({
        rowNum: r,
        item_code,
        official_name,
        item_name,
        item_alias,
        barcode,
        brand,
        category,
        official_sku,
        main_spec,
        detail_spec,
        interface: iface,
        compatibility,
        color,
        image_url,
        official_store_url,
        price,
        status_data
      });
    }

    return { items, errors, totalRows: worksheet.rowCount - 1 };
  }

  // 8a. GET /api/admin/template-excel (Download official Excel template)
  if (req.method === 'GET' && pathname === '/api/admin/template-excel') {
    try {
      const auth = req.headers['authorization'] || parsedUrl.searchParams.get('token') || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Akses ditolak.' });
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Katalog Aksesoris System';
      workbook.created = new Date();

      // Sheet 1: Template Data Produk
      const ws = workbook.addWorksheet('Data Katalog Produk', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });

      ws.columns = [
        { header: 'Kode Item (*Wajib Unik)', key: 'item_code', width: 22 },
        { header: 'Nama Produk Resmi (*Wajib)', key: 'official_name', width: 44 },
        { header: 'Nama Item (POS/ERP)', key: 'item_name', width: 36 },
        { header: 'Item Alias', key: 'item_alias', width: 25 },
        { header: 'Barcode / EAN', key: 'barcode', width: 20 },
        { header: 'Merk / Brand (*Wajib)', key: 'brand', width: 18 },
        { header: 'Kategori Produk', key: 'category', width: 28 },
        { header: 'SKU / Model Resmi', key: 'official_sku', width: 20 },
        { header: 'Spesifikasi Utama', key: 'main_spec', width: 45 },
        { header: 'Spesifikasi Detail & Fitur', key: 'detail_spec', width: 50 },
        { header: 'Konektor / Interface', key: 'interface', width: 28 },
        { header: 'Kompatibilitas', key: 'compatibility', width: 35 },
        { header: 'Warna', key: 'color', width: 15 },
        { header: 'URL Gambar Produk', key: 'image_url', width: 35 },
        { header: 'Link Toko / Marketplace', key: 'official_store_url', width: 35 },
        { header: 'Harga Jual (Rp)', key: 'price', width: 18 },
        { header: 'Status Kelengkapan Data', key: 'status_data', width: 22 }
      ];

      // Style header row
      const headerRow = ws.getRow(1);
      headerRow.height = 30;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' } // Slate 900
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

      // Add sample rows for guidance
      ws.addRow({
        item_code: '003073',
        official_name: 'Vention HDMI to VGA Converter Cable 0.15M Black (42154)',
        item_name: 'Vention HDMI to VGA Converter Cable 0.15M Black',
        item_alias: 'Converter HDMI ke VGA Vention',
        barcode: '6922794742154',
        brand: 'VENTION',
        category: 'Kabel Video & Display',
        official_sku: '42154',
        main_spec: 'Resolusi Full HD 1080P @60Hz, Panjang Kabel 0.15M, Konversi Aktif HDMI ke VGA',
        detail_spec: 'Gold-Plated connector, Plug and Play, chip konversi AG6200, konversi satu arah dari laptop HDMI ke proyektor/monitor VGA',
        interface: 'HDMI Male to VGA Female',
        compatibility: 'PC, Laptop, Proyektor, Monitor, TV Box',
        color: 'Black',
        image_url: '',
        official_store_url: 'https://shopee.co.id/vention.id',
        status_data: 'Lengkap'
      });

      ws.addRow({
        item_code: '003077',
        official_name: 'Vention USB 2.0 to Fast Ethernet RJ45 Adapter 100Mbps 0.15M (CEWHB)',
        item_name: 'Vention USB 2.0 to Fast Ethernet RJ45 Adapter 100Mbps',
        item_alias: 'USB LAN Adapter Vention CEWHB',
        barcode: '6922794746855',
        brand: 'VENTION',
        category: 'Network & Adapter',
        official_sku: 'CEWHB',
        main_spec: 'Kecepatan Jaringan 10/100 Mbps (Fast Ethernet), Panjang Kabel 0.15M, USB 2.0 Interface',
        detail_spec: 'Chipset Realtek RTL8152B, Material ABS Shell tahan panas, indikator LED aktivitas jaringan',
        interface: 'USB 2.0 Male to RJ45 LAN Female',
        compatibility: 'Windows 11/10/8/7, macOS, Linux, Nintendo Switch, Xiaomi Mi Box',
        color: 'Black',
        image_url: '',
        official_store_url: 'https://shopee.co.id/vention.id',
        status_data: 'Lengkap'
      });

      ws.addRow({
        item_code: '004012',
        official_name: 'UGREEN USB-C to USB-C 60W Fast Charging Cable 1M White (10305)',
        item_name: 'UGREEN Cable Type C to Type C 60W 1M',
        item_alias: 'Kabel C to C UGREEN 1 Meter',
        barcode: '6957303813056',
        brand: 'UGREEN',
        category: 'Kabel Data & Charging',
        official_sku: '10305',
        main_spec: 'Output Power PD 60W (20V/3A), Transfer Data 480 Mbps, Panjang 1 Meter',
        detail_spec: 'Support Power Delivery 3.0 & Quick Charge 4.0, kabel TPE fleksibel dengan proteksi overcharge',
        interface: 'USB Type-C to Type-C',
        compatibility: 'MacBook Air/Pro, iPad Pro/Air, Samsung Galaxy S23/S24, iPhone 15/16 series, Laptop USB-C',
        color: 'White',
        image_url: '',
        official_store_url: 'https://shopee.co.id/ugreen.id',
        status_data: 'Lengkap'
      });

      for (let r = 2; r <= 4; r++) {
        const row = ws.getRow(r);
        row.height = 24;
        row.alignment = { vertical: 'middle' };
        row.font = { name: 'Calibri', size: 10 };
      }

      // Sheet 2: Panduan & Kategori
      const wsGuide = workbook.addWorksheet('Panduan & Aturan');
      wsGuide.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Kolom Excel', key: 'col', width: 25 },
        { header: 'Keterangan & Aturan Pengisian', key: 'desc', width: 50 },
        { header: 'Sifat', key: 'req', width: 15 }
      ];
      const gHeader = wsGuide.getRow(1);
      gHeader.height = 28;
      gHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      gHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };

      const guideRows = [
        { no: 1, col: 'Kode Item', desc: 'Kode barang unik dari sistem kasir/POS (misal: 003073)', req: 'Wajib' },
        { no: 2, col: 'Nama Produk Resmi', desc: 'Nama resmi produk lengkap beserta model / panjang kabel', req: 'Wajib' },
        { no: 3, col: 'Nama Item (POS/ERP)', desc: 'Nama item pada struk atau database POS toko', req: 'Opsional' },
        { no: 4, col: 'Item Alias', desc: 'Nama alias atau kata kunci pencarian kasir', req: 'Opsional' },
        { no: 5, col: 'Barcode / EAN', desc: 'Nomor barcode fisik pada dus/kemasan barang', req: 'Disarankan' },
        { no: 6, col: 'Merk / Brand', desc: 'Merk resmi barang (VENTION, UGREEN, ROBOT, VIVAN, REXI, MINIMO, OLIKE, RAPA, dll)', req: 'Wajib' },
        { no: 7, col: 'Kategori Produk', desc: 'Kategori aksesoris (Kabel Video & Display, Network & Adapter, Kabel Data & Charging, dll)', req: 'Disarankan' },
        { no: 8, col: 'SKU / Model Resmi', desc: 'Tipe model dari pabrik (42154, CEWHB, 10305, dll)', req: 'Disarankan' },
        { no: 9, col: 'Spesifikasi Utama', desc: 'Ringkasan spek utama yang tampil pada kartu produk katalog kasir', req: 'Disarankan' },
        { no: 10, col: 'Spesifikasi Detail & Fitur', desc: 'Penjelasan rinci spesifikasi teknis, material, dan fitur unggulan', req: 'Opsional' },
        { no: 11, col: 'Konektor / Interface', desc: 'Tipe sambungan / konektor (HDMI Male to VGA Female, Type-C, dsb)', req: 'Opsional' },
        { no: 12, col: 'Kompatibilitas', desc: 'Dukungan perangkat (Windows, Mac, iOS, Android, Monitor, dsb)', req: 'Opsional' },
        { no: 13, col: 'Warna', desc: 'Varian warna (Black, White, Gray, dll)', req: 'Opsional' },
        { no: 14, col: 'URL Gambar Produk', desc: 'Link langsung file foto (JPG/PNG). Jika kosong, sistem membuat placeholder otomatis', req: 'Opsional' },
        { no: 15, col: 'Link Toko / Marketplace', desc: 'Link produk resmi di Shopee/Tokopedia/website resmi', req: 'Opsional' },
        { no: 16, col: 'Harga Jual (Rp)', desc: 'Harga jual produk dalam Rupiah (angka saja, misal: 35000)', req: 'Opsional' },
        { no: 17, col: 'Status Kelengkapan Data', desc: 'Isi "Lengkap" atau "Belum Lengkap"', req: 'Opsional' }
      ];

      guideRows.forEach(g => wsGuide.addRow(g));

      const fileBuffer = await workbook.xlsx.writeBuffer();
      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Template_Import_Katalog_Aksesoris.xlsx"',
        'Content-Length': fileBuffer.length,
        'Cache-Control': 'no-cache'
      });
      return res.end(fileBuffer);
    } catch (err) {
      console.error('Error generating Excel template:', err);
      return sendJson(req, res, 500, { success: false, message: 'Gagal membuat template Excel: ' + err.message });
    }
  }

  // 8a-2. GET /api/admin/export-excel (Export catalog items with prices to Excel)
  if (req.method === 'GET' && pathname === '/api/admin/export-excel') {
    try {
      const auth = req.headers['authorization'] || parsedUrl.searchParams.get('token') || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Akses ditolak. Silakan login sebagai Admin.' });
      }

      const q = parsedUrl.searchParams.get('q') || '';
      const brand = parsedUrl.searchParams.get('brand') || '';
      const category = parsedUrl.searchParams.get('category') || '';
      const codesParam = parsedUrl.searchParams.get('codes') || '';

      let sql = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (codesParam) {
        const codesList = codesParam.split(',').map(c => c.trim()).filter(Boolean);
        if (codesList.length > 0) {
          const ph = codesList.map(() => '?').join(',');
          sql += ` AND item_code IN (${ph})`;
          params.push(...codesList);
        }
      } else {
        if (q) {
          sql += ` AND (item_code LIKE ? OR item_name LIKE ? OR official_name LIKE ? OR official_sku LIKE ? OR barcode LIKE ?)`;
          const term = `%${q}%`;
          params.push(term, term, term, term, term);
        }
        if (brand && brand !== 'ALL') {
          sql += ` AND brand = ?`;
          params.push(brand);
        }
        if (category && category !== 'ALL') {
          sql += ` AND category = ?`;
          params.push(category);
        }
      }

      sql += ' ORDER BY item_no ASC, id ASC';
      const rows = db.prepare(sql).all(...params);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Katalog Aksesoris System';
      workbook.created = new Date();

      const ws = workbook.addWorksheet('Katalog Produk & Harga', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });

      ws.columns = [
        { header: 'No', key: 'item_no', width: 8 },
        { header: 'Kode Item (*Wajib Unik)', key: 'item_code', width: 22 },
        { header: 'Nama Produk Resmi (*Wajib)', key: 'official_name', width: 45 },
        { header: 'Nama Item (POS/ERP)', key: 'item_name', width: 35 },
        { header: 'Item Alias', key: 'item_alias', width: 25 },
        { header: 'Barcode / EAN', key: 'barcode', width: 20 },
        { header: 'Merk / Brand (*Wajib)', key: 'brand', width: 18 },
        { header: 'Kategori Produk', key: 'category', width: 28 },
        { header: 'SKU / Model Resmi', key: 'official_sku', width: 20 },
        { header: 'Harga Jual (Rp)', key: 'price', width: 20 },
        { header: 'Spesifikasi Utama', key: 'main_spec', width: 45 },
        { header: 'Spesifikasi Detail & Fitur', key: 'detail_spec', width: 50 },
        { header: 'Konektor / Interface', key: 'interface', width: 28 },
        { header: 'Kompatibilitas', key: 'compatibility', width: 35 },
        { header: 'Warna', key: 'color', width: 15 },
        { header: 'URL Gambar Produk', key: 'image_url', width: 35 },
        { header: 'Link Toko / Marketplace', key: 'official_store_url', width: 35 },
        { header: 'Status Kelengkapan Data', key: 'status_data', width: 22 }
      ];

      // Style header row
      const headerRow = ws.getRow(1);
      headerRow.height = 30;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' } // Slate 900
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

      rows.forEach((p, idx) => {
        const row = ws.addRow({
          item_no: p.item_no || idx + 1,
          item_code: p.item_code,
          official_name: p.official_name,
          item_name: p.item_name,
          item_alias: p.item_alias || '',
          barcode: p.barcode || '',
          brand: p.brand,
          category: p.category,
          official_sku: p.official_sku || '',
          price: p.price || 0,
          main_spec: p.main_spec || '',
          detail_spec: p.detail_spec || '',
          interface: p.interface || '',
          compatibility: p.compatibility || '',
          color: p.color || '',
          image_url: p.image_url || '',
          official_store_url: p.official_store_url || '',
          status_data: p.status_data || 'Lengkap'
        });

        // Format price cell as currency number
        const priceCell = row.getCell('price');
        priceCell.numFmt = '#,##0';
        priceCell.alignment = { horizontal: 'right' };
      });

      const today = new Date().toISOString().slice(0, 10);
      const downloadFileName = `Katalog_Produk_Aksesoris_${today}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();

      logActivity('admin', 'Administrator Utama', 'EXPORT_EXCEL', 'CATALOG', `Mengekspor ${rows.length} data produk beserta harga ke file Excel`, { count: rows.length }, req);

      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${downloadFileName}"`,
        'Content-Length': buffer.length,
        'Cache-Control': 'no-cache'
      });
      return res.end(buffer);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      return sendJson(req, res, 500, { success: false, message: 'Gagal mengekspor data Excel: ' + err.message });
    }
  }

  // 8b. POST /api/admin/preview-excel (Preview uploaded Excel file before importing)
  if (req.method === 'POST' && pathname === '/api/admin/preview-excel') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Akses ditolak. Silakan login sebagai Admin.' });
      }

      const body = await parseJsonBody(req);
      if (!body.fileBase64) {
        return sendJson(req, res, 400, { success: false, message: 'File Excel (base64) wajib disertakan.' });
      }

      const buffer = Buffer.from(body.fileBase64, 'base64');
      const { items, errors, totalRows } = await parseExcelProducts(buffer);

      const checkStmt = db.prepare('SELECT id, official_name FROM products WHERE item_code = ?');
      let existingCount = 0;
      let newCount = 0;

      const itemsWithStatus = items.map(item => {
        const found = checkStmt.get(item.item_code);
        const isExisting = !!found;
        if (isExisting) existingCount++;
        else newCount++;
        return {
          ...item,
          isExisting,
          existingName: found ? found.official_name : null
        };
      });

      return sendJson(req, res, 200, {
        success: true,
        totalRows,
        validCount: items.length,
        existingCount,
        newCount,
        errorCount: errors.length,
        errors,
        previewItems: itemsWithStatus.slice(0, 15)
      });
    } catch (err) {
      console.error('Error previewing Excel:', err);
      return sendJson(req, res, 400, { success: false, message: 'Gagal memproses file Excel: ' + err.message });
    }
  }

  // 8c. POST /api/admin/import-excel (Execute batch import into database)
  if (req.method === 'POST' && pathname === '/api/admin/import-excel') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Akses ditolak. Silakan login sebagai Admin.' });
      }

      const body = await parseJsonBody(req);
      if (!body.fileBase64) {
        return sendJson(req, res, 400, { success: false, message: 'File Excel (base64) wajib disertakan.' });
      }

      const updateExisting = body.updateExisting !== false; // default true
      const fileName = body.fileName || 'import.xlsx';

      const buffer = Buffer.from(body.fileBase64, 'base64');
      const { items, errors } = await parseExcelProducts(buffer);

      if (items.length === 0) {
        return sendJson(req, res, 400, {
          success: false,
          message: 'Tidak ada data produk yang valid ditemukan dalam file Excel.',
          errors
        });
      }

      db.exec('BEGIN TRANSACTION');
      let inserted = 0;
      let updated = 0;
      let skipped = 0;

      try {
        const now = new Date().toISOString();
        const maxNoRow = db.prepare('SELECT MAX(item_no) as maxNo FROM products').get();
        let nextNo = (maxNoRow.maxNo || 0) + 1;

        const checkStmt = db.prepare('SELECT id FROM products WHERE item_code = ?');
        
        const insertStmt = db.prepare(`
          INSERT INTO products (
            item_no, item_code, item_name, item_alias, barcode,
            brand, category, official_sku, official_name,
            main_spec, detail_spec, interface, compatibility,
            color, image_url, official_store_url, price, status_data,
            created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?
          )
        `);

        const updateStmt = db.prepare(`
          UPDATE products SET
            item_name = ?, item_alias = ?, barcode = ?,
            brand = ?, category = ?, official_sku = ?, official_name = ?,
            main_spec = ?, detail_spec = ?, interface = ?, compatibility = ?,
            color = ?, image_url = ?, official_store_url = ?, price = ?, status_data = ?,
            updated_at = ?
          WHERE item_code = ?
        `);

        for (const item of items) {
          const existing = checkStmt.get(item.item_code);
          const priceVal = parseInt(item.price, 10) || 0;
          if (existing) {
            if (updateExisting) {
              updateStmt.run(
                item.item_name, item.item_alias, item.barcode,
                item.brand, item.category, item.official_sku, item.official_name,
                item.main_spec, item.detail_spec, item.interface, item.compatibility,
                item.color, item.image_url, item.official_store_url, priceVal, item.status_data,
                now,
                item.item_code
              );
              updated++;
            } else {
              skipped++;
            }
          } else {
            insertStmt.run(
              nextNo++,
              item.item_code, item.item_name, item.item_alias, item.barcode,
              item.brand, item.category, item.official_sku, item.official_name,
              item.main_spec, item.detail_spec, item.interface, item.compatibility,
              item.color, item.image_url, item.official_store_url, priceVal, item.status_data,
              now, now
            );
            inserted++;
          }
        }

        db.exec('COMMIT');

        logActivity(
          'admin', 
          'Administrator Utama', 
          'ITEM_IMPORT', 
          'CATALOG', 
          `Import Excel [${fileName}]: ${inserted} item baru, ${updated} diperbarui${skipped > 0 ? `, ${skipped} dilewati` : ''}.`, 
          { inserted, updated, skipped, fileName }, 
          req
        );

        return sendJson(req, res, 200, {
          success: true,
          message: `Berhasil mengimport data: ${inserted} produk baru ditambahkan, ${updated} produk diperbarui${skipped > 0 ? `, ${skipped} dilewati` : ''}.`,
          inserted,
          updated,
          skipped,
          total: items.length,
          errors
        });
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }
    } catch (err) {
      console.error('Error importing Excel:', err);
      return sendJson(req, res, 500, { success: false, message: 'Gagal mengimport data Excel: ' + err.message });
    }
  }

  // 9. GET /api/admin/stats
  if (req.method === 'GET' && pathname === '/api/admin/stats') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const totalProducts = db.prepare('SELECT count(*) as count FROM products').get().count;
      const totalBrands = db.prepare('SELECT count(DISTINCT brand) as count FROM products').get().count;
      const totalCategories = db.prepare('SELECT count(DISTINCT category) as count FROM products').get().count;
      const totalUsers = db.prepare('SELECT count(*) as count FROM users').get().count;
      return sendJson(req, res, 200, {
        success: true,
        stats: {
          totalProducts,
          totalBrands,
          totalCategories,
          totalUsers,
          totalOutlets: allOutletsList.length,
          cachedStockItems: Object.keys(stockCache).length,
          stockApiUrl: STOCK_API_URL,
          lastStockSyncTime,
          lastStockReportDate
        }
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 10. GET /api/admin/categories
  if (req.method === 'GET' && pathname === '/api/admin/categories') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const categories = db.prepare(`
        SELECT category as name, COUNT(*) as count 
        FROM products 
        GROUP BY category 
        ORDER BY count DESC, category ASC
      `).all();
      return sendJson(req, res, 200, { success: true, categories });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 11. PUT /api/admin/categories
  if (req.method === 'PUT' && pathname === '/api/admin/categories') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const body = await parseJsonBody(req);
      const { oldCategory, newCategory } = body;
      if (!oldCategory || !newCategory) {
        return sendJson(req, res, 400, { success: false, message: 'Kategori lama dan baru wajib diisi' });
      }
      const result = db.prepare('UPDATE products SET category = ? WHERE category = ?').run(newCategory.trim(), oldCategory.trim());
      return sendJson(req, res, 200, {
        success: true,
        message: `Kategori berhasil diubah dari '${oldCategory}' menjadi '${newCategory}'. (${result.changes} produk diperbarui)`
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 12. DELETE /api/admin/categories
  if (req.method === 'DELETE' && pathname === '/api/admin/categories') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const body = await parseJsonBody(req);
      const { category, fallbackCategory } = body;
      if (!category) {
        return sendJson(req, res, 400, { success: false, message: 'Nama kategori wajib diisi' });
      }
      const targetCat = (fallbackCategory || 'Aksesoris / Lainnya').trim();
      const result = db.prepare('UPDATE products SET category = ? WHERE category = ?').run(targetCat, category.trim());
      return sendJson(req, res, 200, {
        success: true,
        message: `Kategori '${category}' berhasil dihapus. ${result.changes} produk dipindahkan ke '${targetCat}'.`
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 13. GET /api/admin/brands
  if (req.method === 'GET' && pathname === '/api/admin/brands') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const brands = db.prepare(`
        SELECT brand as name, COUNT(*) as count 
        FROM products 
        GROUP BY brand 
        ORDER BY count DESC, brand ASC
      `).all();
      return sendJson(req, res, 200, { success: true, brands });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 14. PUT /api/admin/brands
  if (req.method === 'PUT' && pathname === '/api/admin/brands') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const body = await parseJsonBody(req);
      const { oldBrand, newBrand } = body;
      if (!oldBrand || !newBrand) {
        return sendJson(req, res, 400, { success: false, message: 'Brand lama dan baru wajib diisi' });
      }
      const result = db.prepare('UPDATE products SET brand = ? WHERE brand = ?').run(newBrand.trim().toUpperCase(), oldBrand.trim().toUpperCase());
      return sendJson(req, res, 200, {
        success: true,
        message: `Brand berhasil diubah dari '${oldBrand}' menjadi '${newBrand}'. (${result.changes} produk diperbarui)`
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 15. GET /api/admin/api-config
  if (req.method === 'GET' && pathname === '/api/admin/api-config') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      return sendJson(req, res, 200, {
        success: true,
        stockApiUrl: STOCK_API_URL,
        lastSync: lastStockSyncTime,
        reportDate: lastStockReportDate,
        totalOutlets: allOutletsList.length,
        outlets: allOutletsList,
        cachedItemsCount: Object.keys(stockCache).length
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 16. POST /api/admin/api-config (Update API URL)
  if (req.method === 'POST' && pathname === '/api/admin/api-config') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const body = await parseJsonBody(req);
      if (!body.stockApiUrl) {
        return sendJson(req, res, 400, { success: false, message: 'URL API Stok tidak boleh kosong' });
      }
      STOCK_API_URL = body.stockApiUrl.trim().replace(/\/+$/, '');
      setSetting('stock_api_url', STOCK_API_URL);
      
      const syncOk = await syncStockFromAPI();
      return sendJson(req, res, 200, {
        success: true,
        message: 'Konfigurasi URL API berhasil disimpan' + (syncOk ? ' dan sinkronisasi stok berhasil!' : ', namun sinkronisasi awal gagal (cek jaringan/URL).'),
        stockApiUrl: STOCK_API_URL,
        syncOk,
        lastSync: lastStockSyncTime,
        reportDate: lastStockReportDate
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 17. POST /api/admin/test-api (Test Ping & Connectivity)
  if (req.method === 'POST' && pathname === '/api/admin/test-api') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const body = await parseJsonBody(req);
      const targetUrl = (body.url || STOCK_API_URL).trim().replace(/\/+$/, '');
      const startTime = Date.now();

      return new Promise((resolve) => {
        let finished = false;
        const finish = (status, payload) => {
          if (finished) return;
          finished = true;
          sendJson(req, res, status, payload);
          resolve();
        };

        const datesUrl = `${targetUrl}/api/dates`;
        const apiReq = http.get(datesUrl, { timeout: 6000 }, (apiRes) => {
          let d = '';
          apiRes.on('data', c => d += c);
          apiRes.on('end', () => {
            const latency = Date.now() - startTime;
            try {
              const j = JSON.parse(d);
              finish(200, {
                success: true,
                online: true,
                statusCode: apiRes.statusCode,
                latencyMs: latency,
                datesCount: j.dates ? j.dates.length : 0,
                latestDate: (j.dates && j.dates[0]) ? j.dates[0].report_date : null,
                message: `Koneksi berhasil! Server stok merespon dalam ${latency}ms.`
              });
            } catch (pe) {
              finish(200, {
                success: false,
                online: false,
                message: `Server merespon tetapi data bukan format JSON valid.`
              });
            }
          });
        });

        apiReq.on('error', (err) => {
          finish(200, {
            success: false,
            online: false,
            message: `Gagal terhubung ke API: ${err.message}`
          });
        });

        apiReq.on('timeout', () => {
          apiReq.destroy();
          finish(200, {
            success: false,
            online: false,
            message: `Koneksi ke API timeout (>6000ms). Periksa IP dan port server.`
          });
        });
      });
    } catch (e) {
      return sendJson(req, res, 500, { success: false, message: e.message });
    }
  }

  // 18. POST /api/admin/change-password
  if (req.method === 'POST' && pathname === '/api/admin/change-password') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const body = await parseJsonBody(req);
      if (!body.newPassword || body.newPassword.length < 4) {
        return sendJson(req, res, 400, { success: false, message: 'Password baru minimal 4 karakter' });
      }
      ADMIN_PASSWORD = body.newPassword;
      setSetting('admin_password', ADMIN_PASSWORD);
      
      // Also update in users table for admin
      const now = new Date().toISOString();
      db.prepare("UPDATE users SET password = ?, updated_at = ? WHERE username = 'admin'").run(ADMIN_PASSWORD, now);

      return sendJson(req, res, 200, {
        success: true,
        message: 'Password admin berhasil diperbarui!'
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 18b. POST /api/user/change-password (Self Password Change)
  if (req.method === 'POST' && pathname === '/api/user/change-password') {
    try {
      const body = await parseJsonBody(req);
      const username = (body.username || '').trim().toLowerCase();
      const currentPassword = (body.currentPassword || '').trim();
      const newPassword = (body.newPassword || '').trim();

      if (!username || !currentPassword || !newPassword) {
        return sendJson(req, res, 400, { success: false, message: 'Username, password lama, dan password baru wajib diisi!' });
      }

      if (newPassword.length < 4) {
        return sendJson(req, res, 400, { success: false, message: 'Password baru minimal 4 karakter' });
      }

      // Check user in database
      const user = db.prepare('SELECT id, password, role FROM users WHERE username = ?').get(username);
      if (!user) {
        return sendJson(req, res, 404, { success: false, message: 'Pengguna tidak ditemukan' });
      }

      if (user.password !== currentPassword) {
        return sendJson(req, res, 401, { success: false, message: 'Password lama Anda salah!' });
      }

      const now = new Date().toISOString();
      db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(newPassword, now, user.id);

      // If user is admin, also sync ADMIN_PASSWORD setting
      if (username === 'admin') {
        ADMIN_PASSWORD = newPassword;
        setSetting('admin_password', newPassword);
      }

      return sendJson(req, res, 200, {
        success: true,
        message: 'Password akun Anda berhasil diperbarui!'
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 19. GET /api/admin/users (List All Users)
  if (req.method === 'GET' && pathname === '/api/admin/users') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const users = db.prepare(`
        SELECT id, username, full_name, role, assigned_outlet, status, last_login, created_at, updated_at
        FROM users
        ORDER BY id ASC
      `).all();
      return sendJson(req, res, 200, { success: true, users });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 20. POST /api/admin/users (Create User)
  if (req.method === 'POST' && pathname === '/api/admin/users') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const b = await parseJsonBody(req);
      const username = (b.username || '').trim().toLowerCase();
      const password = (b.password || '').trim();
      const full_name = (b.full_name || '').trim();
      const role = (b.role || 'KASIR').trim().toUpperCase();
      const assigned_outlet = (b.assigned_outlet || '').trim();
      const status = (b.status || 'ACTIVE').trim().toUpperCase();

      if (!username || !password || !full_name) {
        return sendJson(req, res, 400, { success: false, message: 'Username, Nama Lengkap, dan Password wajib diisi!' });
      }

      if (username.length < 3) {
        return sendJson(req, res, 400, { success: false, message: 'Username minimal 3 karakter' });
      }

      // Check if username exists
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existing) {
        return sendJson(req, res, 400, { success: false, message: `Username '${username}' sudah digunakan. Pilih username lain.` });
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO users (username, password, full_name, role, assigned_outlet, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(username, password, full_name, role, assigned_outlet, status, now, now);

      logActivity('admin', 'Administrator Utama', 'USER_CREATE', 'USERS', `Membuat pengguna baru '@${username}' (${full_name}) dengan peran ${role}${assigned_outlet ? ' untuk cabang ' + assigned_outlet : ''}`, { username, role, assigned_outlet }, req);

      return sendJson(req, res, 201, {
        success: true,
        message: `Pengguna '${username}' (${full_name}) berhasil dibuat.`
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 21. PUT /api/admin/users/:id (Update User Details)
  if (req.method === 'PUT' && pathname.startsWith('/api/admin/users/') && !pathname.endsWith('/password')) {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const userId = parseInt(pathname.replace('/api/admin/users/', ''), 10);
      if (!userId) {
        return sendJson(req, res, 400, { success: false, message: 'ID pengguna tidak valid' });
      }

      const b = await parseJsonBody(req);
      const full_name = (b.full_name || '').trim();
      const role = (b.role || 'KASIR').trim().toUpperCase();
      const assigned_outlet = (b.assigned_outlet || '').trim();
      const status = (b.status || 'ACTIVE').trim().toUpperCase();

      if (!full_name) {
        return sendJson(req, res, 400, { success: false, message: 'Nama lengkap wajib diisi' });
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        UPDATE users SET
          full_name = ?, role = ?, assigned_outlet = ?, status = ?, updated_at = ?
        WHERE id = ?
      `);
      const result = stmt.run(full_name, role, assigned_outlet, status, now, userId);

      if (result.changes === 0) {
        return sendJson(req, res, 404, { success: false, message: 'Pengguna tidak ditemukan' });
      }

      logActivity('admin', 'Administrator Utama', 'USER_UPDATE', 'USERS', `Memperbarui data pengguna ID #${userId} (${full_name}, Peran: ${role}, Status: ${status})`, { userId, role, status, assigned_outlet }, req);

      return sendJson(req, res, 200, {
        success: true,
        message: 'Data pengguna berhasil diperbarui.'
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 22. PUT /api/admin/users/:id/password (Reset User Password)
  if (req.method === 'PUT' && pathname.startsWith('/api/admin/users/') && pathname.endsWith('/password')) {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const match = pathname.match(/^\/api\/admin\/users\/(\d+)\/password$/);
      if (!match) {
        return sendJson(req, res, 400, { success: false, message: 'Endpoint tidak valid' });
      }
      const userId = parseInt(match[1], 10);
      const b = await parseJsonBody(req);
      const newPassword = (b.newPassword || '').trim();

      if (!newPassword || newPassword.length < 4) {
        return sendJson(req, res, 400, { success: false, message: 'Password baru minimal 4 karakter' });
      }

      const targetUser = db.prepare('SELECT username, full_name FROM users WHERE id = ?').get(userId);

      const now = new Date().toISOString();
      const stmt = db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?');
      const result = stmt.run(newPassword, now, userId);

      if (result.changes === 0) {
        return sendJson(req, res, 404, { success: false, message: 'Pengguna tidak ditemukan' });
      }

      logActivity('admin', 'Administrator Utama', 'PASSWORD_RESET', 'USERS', `Mereset password pengguna '@${targetUser ? targetUser.username : userId}'`, { userId }, req);

      return sendJson(req, res, 200, {
        success: true,
        message: 'Password pengguna berhasil di-reset!'
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 23. DELETE /api/admin/users/:id (Delete User)
  if (req.method === 'DELETE' && pathname.startsWith('/api/admin/users/')) {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      const userId = parseInt(pathname.replace('/api/admin/users/', ''), 10);
      if (!userId) {
        return sendJson(req, res, 400, { success: false, message: 'ID pengguna tidak valid' });
      }

      // Check if user is main admin
      const targetUser = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
      if (!targetUser) {
        return sendJson(req, res, 404, { success: false, message: 'Pengguna tidak ditemukan' });
      }

      if (targetUser.username === 'admin' || userId === 1) {
        return sendJson(req, res, 400, { success: false, message: 'Akun Superadmin utama tidak dapat dihapus!' });
      }

      db.prepare('DELETE FROM users WHERE id = ?').run(userId);

      logActivity('admin', 'Administrator Utama', 'USER_DELETE', 'USERS', `Menghapus akun pengguna '@${targetUser.username}' (ID #${userId})`, { userId, username: targetUser.username }, req);

      return sendJson(req, res, 200, {
        success: true,
        message: `Pengguna '${targetUser.username}' berhasil dihapus.`
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 24. GET /api/admin/logs (Activity Logs)
  if (req.method === 'GET' && pathname === '/api/admin/logs') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }

      const q = (parsedUrl.searchParams.get('q') || '').trim().toLowerCase();
      const moduleFilter = (parsedUrl.searchParams.get('module') || '').trim();
      const limit = parseInt(parsedUrl.searchParams.get('limit') || '100', 10);

      let sql = 'SELECT * FROM activity_logs WHERE 1=1';
      const params = [];

      if (moduleFilter && moduleFilter !== 'ALL') {
        sql += ' AND module = ?';
        params.push(moduleFilter);
      }

      if (q) {
        sql += ' AND (LOWER(username) LIKE ? OR LOWER(full_name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(action) LIKE ?)';
        const pattern = `%${q}%`;
        params.push(pattern, pattern, pattern, pattern);
      }

      sql += ' ORDER BY id DESC LIMIT ?';
      params.push(limit);

      const logs = db.prepare(sql).all(...params);
      const totalLogs = db.prepare('SELECT count(*) as count FROM activity_logs').get().count;

      return sendJson(req, res, 200, {
        success: true,
        total: totalLogs,
        logs
      });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // 25. DELETE /api/admin/logs (Clear Activity Logs)
  if (req.method === 'DELETE' && pathname === '/api/admin/logs') {
    try {
      const auth = req.headers['authorization'] || '';
      if (!auth.includes('auth-token-admin')) {
        return sendJson(req, res, 403, { success: false, message: 'Unauthorized' });
      }
      db.prepare('DELETE FROM activity_logs').run();
      logActivity('admin', 'Administrator Utama', 'LOGS_CLEARED', 'SYSTEM', 'Semua riwayat log aktifitas dibersihkan oleh administrator.', null, req);
      return sendJson(req, res, 200, { success: true, message: 'Log aktifitas berhasil dibersihkan.' });
    } catch (err) {
      return sendJson(req, res, 500, { success: false, message: err.message });
    }
  }

  // -----------------------------------------------------------------
  // STATIC FILE SERVING
  // -----------------------------------------------------------------
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath)) {
    if (pathname.startsWith('/api/') || pathname.startsWith('/images/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File Not Found');
    }
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);

    // ETag and Last-Modified for intelligent browser caching
    const etag = `W/"${stat.size}-${stat.mtime.getTime()}"`;
    const lastModified = stat.mtime.toUTCString();

    const clientEtag = req.headers['if-none-match'];
    const clientModified = req.headers['if-modified-since'];

    // Long-term caching for static images and bundled assets (30 days)
    const isCacheable = pathname.startsWith('/images/') || pathname.startsWith('/assets/');
    const cacheControl = isCacheable ? 'public, max-age=2592000, immutable' : 'no-cache';

    // Return 304 Not Modified if browser already has the latest file
    if ((clientEtag && clientEtag === etag) || (clientModified && clientModified === lastModified)) {
      res.writeHead(304, {
        'ETag': etag,
        'Last-Modified': lastModified,
        'Cache-Control': cacheControl
      });
      return res.end();
    }

    const content = fs.readFileSync(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': cacheControl,
      'ETag': etag,
      'Last-Modified': lastModified
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File Not Found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`📱 KATALOG AKSESORIS & PRODUCT KNOWLEDGE SERVER BERJALAN`);
  console.log(`📡 URL Lokal:   http://localhost:${PORT}`);
  console.log(`📡 URL Jaringan: http://${HOST}:${PORT}`);
  console.log(`🔗 API Stok:     ${STOCK_API_URL}`);
  console.log(`=======================================================`);
});
