const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function syncDatabase() {
  try {
    console.log('Starting database sync with Excel file...\n');

    // Read Excel file
    const filePath = path.join(__dirname, 'data', 'inventory.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Parse Excel data — track category from first column
    const firstColKey = Object.keys(rawData[0])[0]; // e.g. "ATHENA WOMEN"
    let currentCategory = firstColKey; // first section name comes from cell A1

    const excelProducts = [];
    for (const row of rawData.slice(1)) {
      const firstColVal = (row[firstColKey] || '').toString().trim();
      // If first column has a non-numeric, non-date, non-label string → new category
      if (firstColVal && isNaN(Number(firstColVal)) && firstColVal !== 'NEW' && firstColVal !== 'DATE') {
        currentCategory = firstColVal;
      }
      const name = (row.__EMPTY || '').toString().trim();
      const code = (row.__EMPTY_3 || '').toString().trim();
      if (name && code) {
        excelProducts.push({
          name,
          stock: parseInt(row.__EMPTY_1) || 0,
          price: parseFloat(row.__EMPTY_2) || 0,
          code,
          category: currentCategory,
          sortOrder: excelProducts.length,
        });
      }
    }

    console.log(`Found ${excelProducts.length} products in Excel file\n`);

    // Get existing products from database
    const dbProducts = await prisma.product.findMany({
      select: { id: true, code: true, name: true, price: true, stock: true, category: true, sortOrder: true }
    });
    console.log(`Found ${dbProducts.length} products in database\n`);

    const excelMap = new Map(excelProducts.map(p => [p.code, p]));
    const dbMap = new Map(dbProducts.map(p => [p.code, p]));

    // 1. Update existing products
    let updated = 0;
    const productsToUpdate = [];
    for (const dbProd of dbProducts) {
      if (dbProd.code && excelMap.has(dbProd.code)) {
        const excelProd = excelMap.get(dbProd.code);
        if (dbProd.price !== excelProd.price ||
            dbProd.stock !== excelProd.stock ||
            dbProd.name !== excelProd.name ||
            dbProd.category !== excelProd.category ||
            dbProd.sortOrder !== excelProd.sortOrder) {
          productsToUpdate.push({ id: dbProd.id, ...excelProd });
        }
      }
    }

    for (const prod of productsToUpdate) {
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          name: prod.name,
          price: prod.price,
          stock: prod.stock,
          code: prod.code,
          category: prod.category,
          sortOrder: prod.sortOrder,
        }
      });
      updated++;
      if (updated % 100 === 0) process.stdout.write(`✓ Updated ${updated}...\r`);
    }
    console.log(`✓ Updated ${updated} products with new prices/stock\n`);

    // 2. Add missing products
    let added = 0;
    let skipped = 0;
    for (const excelProd of excelProducts) {
      if (!dbMap.has(excelProd.code)) {
        try {
          await prisma.product.create({
            data: {
              name: excelProd.name,
              category: excelProd.category,
              price: excelProd.price,
              stock: excelProd.stock,
              code: excelProd.code,
              sortOrder: excelProd.sortOrder,
            }
          });
          added++;
          if (added % 100 === 0) process.stdout.write(`✓ Added ${added}...\r`);
        } catch (err) {
          skipped++;
        }
      }
    }
    if (skipped > 0) console.log(`⚠ Skipped ${skipped} products with duplicate codes`);
    console.log(`✓ Added ${added} new products from Excel\n`);

    // 3. Remove products not in Excel (including null/empty codes)
    const productsToDelete = dbProducts.filter(p => {
      // Delete if code is null/empty OR code not in Excel
      if (!p.code || p.code.trim() === '') return true;
      return !excelMap.has(p.code);
    });

    let deleted = 0;
    for (const prod of productsToDelete) {
      // First delete sale items referencing this product
      await prisma.saleItem.deleteMany({
        where: { productId: prod.id }
      });
      // Then delete the product
      await prisma.product.delete({
        where: { id: prod.id }
      });
      deleted++;
      if (deleted % 100 === 0) process.stdout.write(`✓ Deleted ${deleted}...\r`);
    }
    console.log(`✓ Deleted ${deleted} products not found in Excel\n`);

    // 4. Force-update sortOrder for all products to match Excel order
    console.log('Updating sort order...');
    let sortUpdated = 0;
    for (const excelProd of excelProducts) {
      const dbProd = dbMap.get(excelProd.code);
      if (dbProd) {
        await prisma.product.update({
          where: { id: dbProd.id },
          data: { sortOrder: excelProd.sortOrder }
        });
        sortUpdated++;
        if (sortUpdated % 100 === 0) process.stdout.write(`✓ Sort order ${sortUpdated}...\r`);
      }
    }
    console.log(`✓ Sort order updated for ${sortUpdated} products\n`);

    // Verify final state
    const finalCount = await prisma.product.count();
    console.log('=== SYNC COMPLETE ===');
    console.log(`Excel products: ${excelProducts.length}`);
    console.log(`Database products: ${finalCount}`);
    console.log(`Updated: ${updated}`);
    console.log(`Added: ${added}`);
    console.log(`Deleted: ${deleted}`);

    if (finalCount === excelProducts.length) {
      console.log('\n✓ Database is now in sync with Excel file!');
    } else {
      console.log(`\n⚠ Warning: Database (${finalCount}) doesn't match Excel (${excelProducts.length})`);
    }

  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncDatabase();
