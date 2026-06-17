/**
 * sync-from-excel.js
 * Safe one-way sync: Excel → DB
 * - ADDS products that don't exist yet (matched by code)
 * - UPDATES name + category for existing products to match Excel
 * - Runs specific cleanups (duplicate removals) only when safe (no sales)
 * - Never updates stock, price, or anything on Sales/SaleItem tables
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

    if (col0 && typeof col0 === 'string') {
      const upper = col0.trim().toUpperCase();
      if (KNOWN_CATEGORIES.has(upper) || KNOWN_CATEGORIES.has(col0.trim())) {
        currentCategory = col0.trim();
      }
    }

    if (!name || name === 'ITEM DESCRIPTION') continue;
    const nameStr = name.toString().trim();
    if (!nameStr) continue;

    const codeStr = code?.toString().trim();
    if (!codeStr) continue;

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
  const excelProducts = parseExcel('./data/stocks.xlsx');
  console.log(`Excel: ${excelProducts.length} products with codes`);

  const existing = await prisma.product.findMany({ select: { code: true, name: true, category: true } });
  const existingMap = new Map(existing.map(p => [p.code?.toString().trim(), p]));
  console.log(`DB:    ${existing.length} products currently\n`);

  // Get next sortOrder
  const maxSort = await prisma.product.aggregate({ _max: { sortOrder: true } });
  let sortOrder = (maxSort._max.sortOrder || 0) + 1;

  let added = 0, updated = 0, failed = 0;

  for (const p of excelProducts) {
    try {
      if (existingMap.has(p.code)) {
        const current = existingMap.get(p.code);
        // Only update if name or category actually changed
        if (current.name !== p.name || current.category !== p.category || current.price !== p.price) {
          await prisma.product.update({
            where: { code: p.code },
            data: { name: p.name, category: p.category, price: p.price },
          });
          console.log(`  ✏️  Updated [${p.code}] "${current.name}" → "${p.name}"`);
          updated++;
        }
      } else {
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
      }
    } catch (e) {
      console.log(`  ❌ Failed [${p.code}] ${p.name} — ${e.message}`);
      failed++;
    }
  }

  // --- Cleanup: remove known duplicates only if they have no sales ---
  const toCleanup = [
    { code: '4237', reason: 'merged into A1028 (MAXI WIDE LEG LEGGINGS/SKINNY WIDELEG)' },
    { code: 'NA 001', reason: 'duplicate of NA0010 (SILVER MOON LONG DRESS)' },
  ];

  console.log('\n--- Cleanup ---');
  for (const { code, reason } of toCleanup) {
    const product = await prisma.product.findUnique({ where: { code } });
    if (!product) {
      console.log(`  ⏭️  [${code}] not found — already clean`);
      continue;
    }
    const salesCount = await prisma.saleItem.count({ where: { productId: product.id } });
    if (salesCount > 0) {
      console.log(`  ⚠️  [${code}] ${product.name} has ${salesCount} sale(s) — skipping delete`);
    } else {
      await prisma.product.delete({ where: { code } });
      console.log(`  🗑️  Deleted [${code}] ${product.name} — ${reason}`);
    }
  }

  const finalCount = await prisma.product.count();
  console.log(`\nDone! ${added} added, ${updated} updated, ${failed} failed.`);
  console.log(`DB now has ${finalCount} products. Sales & transactions untouched.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
