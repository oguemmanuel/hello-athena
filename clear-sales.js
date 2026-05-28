const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearSales() {
  try {
    console.log('Clearing all transaction history and reports...\n');

    const deletedItems = await prisma.saleItem.deleteMany({});
    console.log(`✓ Deleted ${deletedItems.count} sale items`);

    const deletedSales = await prisma.sale.deleteMany({});
    console.log(`✓ Deleted ${deletedSales.count} sales/transactions`);

    console.log('\n✅ All transaction history and reports cleared!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSales();
