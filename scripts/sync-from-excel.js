/**
 * sync-from-excel.js
 * Safe one-way sync: Excel → DB
 * - Only ADDS products that don't exist yet (matched by code)
 * - Never updates existing products
 * - Never deletes anything
 * - Never touches Sales or SaleItem tables
 * Run this on the shop PC after deploying a new build.
 */
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KNOWN_CATEGORIES = new Set([
  'ATHENA WOMEN','BLAZER','BLAZERS','CORPRATE DRESS','2PCS WEARS','TOPS','SKIRTS',
  'COAST DRESSES','JUMPSUIT','TROUSERS','TROESERS','BAGS','HEELS','PERFUMES',
  'UNDERWEAWRS','UNDERWEARS','ATHENA MEN','T-SHIRTS','MEN 2PCS','KAFTAN 2PCS',
  'SUITS','WINTER JACKET','SHORT SLEEVES','LONG SLEEVES','SHORTS','JOGGERS',
  'JEANS','TIE','SHOES','ATHENA KIDS','**'
]);

function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const products = [];
  let currentCategory = '';

  for (let i = 0; i < rows.length; i++) {
    const [col0, name, qty, price, code] = rows[i];

    // Detect category change (col A is a known category name)
    if (col0 && typeof col0 === 'string') {
      const upper = col0.trim().toUpperCase();
      if (KNOWN_CATEGORIES.has(upper) || KNOWN_CATEGORIES.has(col0.trim())) {
        currentCategory = col0.trim();
      }
    }

    // Skip header/label rows
    if (!name || name === 'ITEM DESCRIPTION') continue;
    const nameStr = name.toString().trim();
    if (!nameStr) continue;

    const codeStr = code?.toString().trim();
    if (!codeStr) continue; // skip products without a code

    products.push({
      name: nameStr,
      category: currentCategory,
      stock: typeof qty === 'number' ? qty : parseInt(qty) || 0,
      price: typeof price === 'number' ? price : parseFloat(price) || 0,
      code: codeStr,
    });
  }

  return products;
}

async function main() {
  const excelPath = './data/stocks.xlsx';
  const excelProducts = parseExcel(excelPath);
  console.log(`Excel: ${excelProducts.length} products with codes`);

  // Get all codes already in DB
  const existing = await prisma.product.findMany({ select: { code: true } });
  const existingCodes = new Set(existing.map(p => p.code?.toString().trim()));
  console.log(`DB:    ${existing.length} products currently`);

  // Only products not yet in DB
  const toAdd = excelProducts.filter(p => !existingCodes.has(p.code));
  console.log(`New:   ${toAdd.length} products to add\n`);

  if (toAdd.length === 0) {
    console.log('✅ Already in sync — nothing to add.');
    return;
  }

  // Get next sortOrder
  const maxSort = await prisma.product.aggregate({ _max: { sortOrder: true } });
  let sortOrder = (maxSort._max.sortOrder || 0) + 1;

  let added = 0, failed = 0;
  for (const p of toAdd) {
    try {
      await prisma.product.create({
        data: {
          name: p.name,
          category: p.category,
          price: p.price,
          stock: p.stock,
          code: p.code,
          sortOrder: sortOrder++,
        }
      });
      console.log(`  ✅ Added [${p.code}] ${p.name} (${p.category}) — stock:${p.stock}, price:${p.price}`);
      added++;
    } catch (e) {
      console.log(`  ❌ Failed [${p.code}] ${p.name} — ${e.message}`);
      failed++;
    }
  }

  const finalCount = await prisma.product.count();
  console.log(`\nDone! ${added} added, ${failed} failed.`);
  console.log(`DB now has ${finalCount} products. Sales & transactions untouched.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
