const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Most comprehensive category mapping
const categoryKeywords = {
  'Women Suits': ['women suit', 'suit', 'sleeveless', 'women dress'],
  'Blazers': ['blazer', 'balzer'],
  'Corporate Dresses': ['corporate', 'corp', 'cami', 'bodycon', 'midi', 'dinner', 'premium', 'formal', 'dress'],
  'Coast Dresses': ['coast', 'gown', 'brides', 'prom', 'beaded', 'glitter', 'pleated', 'evening'],
  '2PCS Wears': ['2pcs', '2 piece', 'beach', 'wideleg', 'wide leg', 'jumpsuit', 'overall', 'jogger'],
  'Tops': ['top', 'shirt', 'sweater', 'inner', 'mesh', 'polo', 'button', 'lacoste', 'hoodie', 'hoddie', 'tshirt', 't-shirt', 'casual', 'pretty little', 'blouse', 'sleeve'],
  'Skirts': ['skirt', 'legging', 'maxi', 'pants', 'leg'],
  'Men Suits': ['men suit', 'groom', 'political', 'emerald', 'cordorey', '3pcs suit'],
  'Winter Jackets': ['jacket', 'winter', 'denim jacket', 'cropped'],
  'Men Short Sleeves': ['short sleeve', 'shortsleeve'],
  'Men Long Sleeves': ['long sleeve', 'longsleeve', 'linen'],
  'Men Shorts': ['shorts', 'swim', 'cargo', 'trunk'],
  'Men Trousers': ['trouser', 'pants', 'tall', 'kaftan', 'legging', 'straight leg', 'fit'],
  'Jeans': ['jeans', 'denim', 'jean', 'skinny'],
  'Underwear': ['underwear', 'panties', 'boxers', 'socks', 'nighty', 'period'],
  'Accessories': ['bag', 'backpack', 'suitcase', 'tie', 'bowtie', 'noos', 'scarf', 'broach', 'brouch', 'brooch', 'watch'],
  'Shoes': ['shoe', 'heel', 'sneaker', 'slipper', 'sandal', 'birkes', 'lofa', 'convas', 'adidas', 'boat', 'puma', 'nike', 'burch', 'louis', 'clarks', 'bass', 'gucci', 'dior', 'coach', 'fendi'],
  'Kids': ['kids', 'children', 'baby', 'sleep', 'ballet', 'mamas', 'boys round', 'girls round'],
};

function categorizeProduct(name) {
  const lowerName = name.toLowerCase();
  const allMatches = [];

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        allMatches.push({ category, keyword, length: keyword.length });
      }
    }
  }

  if (allMatches.length > 0) {
    const best = allMatches.sort((a, b) => b.length - a.length)[0];
    return best.category;
  }

  return 'General';
}

async function updateAllCategories() {
  try {
    const allProducts = await prisma.product.findMany({
      select: { id: true, name: true, category: true }
    });

    console.log(`Recategorizing all ${allProducts.length} products...\n`);

    let updated = 0;

    for (const product of allProducts) {
      const newCategory = categorizeProduct(product.name);

      if (newCategory !== product.category) {
        await prisma.product.update({
          where: { id: product.id },
          data: { category: newCategory }
        });
        updated++;
      }

      if ((updated) % 100 === 0) {
        process.stdout.write(`✓ Updated ${updated}...\r`);
      }
    }

    console.log(`✓ Updated ${updated} products                  \n`);

    // Show final breakdown
    const categoryBreakdown = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } }
    });

    console.log('Final category breakdown:');
    console.log('─'.repeat(40));
    let totalProducts = 0;
    categoryBreakdown.forEach(cat => {
      console.log(`${cat.category.padEnd(25)} ${cat._count.toString().padStart(3)}`);
      totalProducts += cat._count;
    });
    console.log('─'.repeat(40));
    console.log(`${'TOTAL'.padEnd(25)} ${totalProducts.toString().padStart(3)}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllCategories();
