const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'catalog.db');
const db = new DatabaseSync(dbPath);

console.log('Initializing catalog database schema at:', dbPath);

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
    status_data TEXT DEFAULT 'Lengkap',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

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

// Check if initial dataset exists locally to seed
const parsedPath = path.join(__dirname, 'parsed_items.json');
if (fs.existsSync(parsedPath)) {
  let allData = {};
  try {
    const ugreen = fs.existsSync('./ugreen_data.js') ? require('./ugreen_data.js') : {};
    const vention = fs.existsSync('./vention_data.js') ? require('./vention_data.js') : {};
    const robotVivan = fs.existsSync('./robot_vivan_data.js') ? require('./robot_vivan_data.js') : {};
    const rexi = fs.existsSync('./rexi_data.js') ? require('./rexi_data.js') : {};
    const ufoneUime = fs.existsSync('./ufone_uime_data.js') ? require('./ufone_uime_data.js') : {};
    const minimoOlikeRapa = fs.existsSync('./minimo_olike_rapa_data.js') ? require('./minimo_olike_rapa_data.js') : {};
    const other = fs.existsSync('./other_data.js') ? require('./other_data.js') : {};

    allData = {
      ...ugreen,
      ...vention,
      ...robotVivan,
      ...rexi,
      ...ufoneUime,
      ...minimoOlikeRapa,
      ...other
    };
  } catch (err) {
    console.warn('Notice: some vendor data files not loaded:', err.message);
  }

  const items = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));
  console.log(`Inserting ${items.length} items into products table...`);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      item_no, item_code, item_name, item_alias, barcode,
      brand, category, official_sku, official_name,
      main_spec, detail_spec, interface, compatibility,
      color, image_url, official_store_url, status_data,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `);

  const now = new Date().toISOString();
  db.exec('BEGIN TRANSACTION');

  try {
    items.forEach((it, idx) => {
      const d = allData[it.code] || {};
      insertStmt.run(
        idx + 1,
        it.code,
        it.name,
        it.alias || '',
        it.barcode || '',
        it.brand || d.brand || 'CAMPURAN',
        normalizeProductCategory({
          item_name: it.name,
          official_name: d.fullName || it.name,
          main_spec: d.mainSpec,
          interface: d.interface,
          category: d.category || it.model || 'Aksesoris HP'
        }),
        d.sku || it.alias || it.code,
        d.fullName || it.name,
        d.mainSpec || 'Spesifikasi standar aksesoris',
        d.detailSpec || 'Kualitas terjamin, material kuat dan awet.',
        d.interface || 'Standard Port',
        d.compatibility || 'Universal kompatibel',
        d.color || 'Standar',
        d.imageUrl || '',
        d.officialUrl || '',
        d.statusData || 'Lengkap',
        now,
        now
      );
    });
    db.exec('COMMIT');
    console.log(`Successfully committed ${items.length} items to catalog.db`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error seeding catalog:', err);
  }
} else {
  console.log('Database schema created. You can import catalog products anytime using the Import Excel feature in the Admin panel.');
}

const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get();
console.log('Total products in database:', countRow.count);

db.close();
