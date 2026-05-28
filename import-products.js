const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importProducts() {
  try {
    // Read Excel file
    const filePath = path.join(__dirname, 'data', 'inventory.xlsx');
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${rawData.length} rows in Excel file`);

    // Parse the data - first row is headers
    const headers = rawData[0];
    const dataRows = rawData.slice(1).filter(row => {
      // Filter out empty rows
      return row.__EMPTY && row.__EMPTY.trim && row.__EMPTY.trim() !== '';
    });

    console.log(`Found ${dataRows.length} actual product rows`);

    // Get existing products by code
    const existingProducts = await prisma.product.findMany({
      select: { code: true, name: true }
    });
    const existingCodeMap = new Map(existingProducts.map(p => [p.code, p]));

    console.log(`Found ${existingProducts.length} products in database`);

    // Parse products from Excel
    const excelProducts = dataRows.map(row => ({
      name: (row.__EMPTY || '').toString().trim(),
      stock: parseInt(row.__EMPTY_1) || 0,
      price: parseFloat(row.__EMPTY_2) || 0,
      code: (row.__EMPTY_3 || '').toString().trim(),
      quantity: parseInt(row.__EMPTY_1) || 0
    })).filter(p => p.code && p.name); // Filter by code

    console.log(`Found ${excelProducts.length} valid products in Excel`);

    // Find missing products
    const missingProducts = excelProducts.filter(item => !existingCodeMap.has(item.code));

    console.log(`Found ${missingProducts.length} missing products to import`);

    if (missingProducts.length === 0) {
      console.log('No missing products to import');
      return;
    }

    // Import missing products
    let imported = 0;
    for (const item of missingProducts) {
      try {
        await prisma.product.create({
          data: {
            name: item.name,
            category: 'General', // Default category since Excel doesn't specify
            price: item.price,
            stock: item.quantity,
            code: item.code,
          }
        });
        imported++;
        console.log(`✓ Imported: ${item.code} - ${item.name}`);
      } catch (err) {
        console.error(`✗ Failed to import ${item.code}:`, err.message);
      }
    }

    console.log(`\n✓ Successfully imported ${imported}/${missingProducts.length} products`);

  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();
