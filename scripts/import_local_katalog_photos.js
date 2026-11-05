/**
 * Batch Importer for Product Catalog Photos
 * Reads C:\Users\Komputer\Downloads\Katalog\produk_katalog
 * Copies photos to public/images/products/${item_code}.jpg, _2.jpg, etc.
 * Updates image_url and gallery_images in catalog.db.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const sourceDir = 'C:\\Users\\Komputer\\Downloads\\Katalog\\produk_katalog';
const destDir = path.join(__dirname, '..', 'public', 'images', 'products');
const dbPath = path.join(__dirname, '..', 'catalog.db');

if (!fs.existsSync(sourceDir)) {
  console.error(`Folder sumber tidak ditemukan di: ${sourceDir}`);
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
const products = db.prepare('SELECT id, item_no, item_code, official_name FROM products').all();

function clean(str) {
  return (str || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

console.log(`[Batch Import] Membaca folder: ${sourceDir}`);
console.log(`[Batch Import] Total produk dalam database: ${products.length}`);

const folders = fs.readdirSync(sourceDir).filter(f => {
  try {
    return fs.statSync(path.join(sourceDir, f)).isDirectory();
  } catch (e) {
    return false;
  }
});

console.log(`[Batch Import] Ditemukan ${folders.length} folder produk.`);

// Build exact mapping from item_code to folder
const codeToFolderMap = new Map();

folders.forEach(f => {
  const m = f.match(/^\d+\.\s*(.*)$/);
  const rawTitle = m ? m[1] : f;
  const cTitle = clean(rawTitle);

  // 1. Exact clean match
  let matches = products.filter(p => clean(p.official_name) === cTitle);

  // 2. Prefix match (if Windows path was truncated)
  if (matches.length === 0) {
    matches = products.filter(p => {
      const cDb = clean(p.official_name);
      return cDb.startsWith(cTitle) || cTitle.startsWith(cDb);
    });
  }

  matches.forEach(p => {
    codeToFolderMap.set(p.item_code, f);
  });
});

console.log(`[Batch Import] Produk yang berhasil dicocokkan: ${codeToFolderMap.size} dari ${products.length}`);

const updateStmt = db.prepare('UPDATE products SET image_url = ?, gallery_images = ?, updated_at = ? WHERE item_code = ?');
const now = new Date().toISOString();

let copiedFilesCount = 0;
let updatedProductsCount = 0;

for (const p of products) {
  const folderName = codeToFolderMap.get(p.item_code);
  if (!folderName) {
    console.warn(`[Warning] Tidak ada folder yang cocok untuk [${p.item_code}] ${p.official_name}`);
    continue;
  }

  const folderPath = path.join(sourceDir, folderName);
  let filesInFolder = [];
  try {
    filesInFolder = fs.readdirSync(folderPath);
  } catch (e) {
    console.error(`Error reading ${folderPath}:`, e.message);
    continue;
  }

  // Filter image files and sort: foto_1, foto_2, etc.
  const photoFiles = filesInFolder.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  }).sort((a, b) => {
    const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
    const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
    return numA - numB;
  });

  if (photoFiles.length === 0) {
    console.warn(`[Warning] Folder kosong tidak ada foto: ${folderName}`);
    continue;
  }

  const galleryList = [];

  photoFiles.forEach((srcFileName, idx) => {
    const ext = path.extname(srcFileName).toLowerCase();
    // Index 0 -> ${item_code}${ext} (Cover Utama)
    // Index 1..n -> ${item_code}_${idx + 1}${ext}
    const destFileName = idx === 0 ? `${p.item_code}${ext}` : `${p.item_code}_${idx + 1}${ext}`;
    const srcFilePath = path.join(folderPath, srcFileName);
    const destFilePath = path.join(destDir, destFileName);

    try {
      fs.copyFileSync(srcFilePath, destFilePath);
      copiedFilesCount++;
      galleryList.push(`/images/products/${destFileName}`);
    } catch (err) {
      console.error(`Gagal menyalin ${srcFilePath} -> ${destFilePath}:`, err.message);
    }
  });

  const primaryImage = galleryList[0] || '';

  updateStmt.run(primaryImage, JSON.stringify(galleryList), now, p.item_code);
  updatedProductsCount++;
}

console.log('=======================================================');
console.log(`✅ SELESAI IMPORT FOTO KATALOG PRODUK`);
console.log(`📁 Total file foto berhasil disalin: ${copiedFilesCount} foto`);
console.log(`📦 Total produk di database yang di-update: ${updatedProductsCount} produk`);
console.log(`📂 Lokasi tujuan: ${destDir}`);
console.log('=======================================================');
