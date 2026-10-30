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
        d.category || it.model || 'Aksesoris HP',
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
