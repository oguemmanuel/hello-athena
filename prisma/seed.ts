import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.product.deleteMany({})

  const products = [
    {
      name: 'Classic Polo Shirt',
      category: 'Shirts',
      price: 89.99,
      stock: 15,
      color: 'Navy',
      sku: 'POLO-001'
    },
    {
      name: 'Oxford Button-Up',
      category: 'Shirts',
      price: 99.99,
      stock: 12,
      color: 'White',
      sku: 'OXF-001'
    },
    {
      name: 'Slim Fit Jeans',
      category: 'Pants',
      price: 129.99,
      stock: 20,
      color: 'Dark Blue',
      size: '32',
      sku: 'JEANS-001'
    },
    {
      name: 'Chino Trousers',
      category: 'Pants',
      price: 119.99,
      stock: 18,
      color: 'Khaki',
      size: '34',
      sku: 'CHINO-001'
    },
    {
      name: 'Wool Blazer',
      category: 'Jackets',
      price: 249.99,
      stock: 8,
      color: 'Black',
      size: 'M',
      sku: 'BLAZ-001'
    },
    {
      name: 'Summer Dress',
      category: 'Dresses',
      price: 159.99,
      stock: 10,
      color: 'Floral',
      size: 'S',
      sku: 'DRESS-001'
    },
    {
      name: 'V-Neck Sweater',
      category: 'Sweaters',
      price: 109.99,
      stock: 14,
      color: 'Grey',
      size: 'M',
      sku: 'SWEAT-001'
    },
    {
      name: 'Kids T-Shirt',
      category: 'Kids',
      price: 34.99,
      stock: 25,
      color: 'Red',
      size: '8-10',
      sku: 'KIDS-001'
    },
    {
      name: 'Leather Belt',
      category: 'Accessories',
      price: 49.99,
      stock: 30,
      color: 'Brown',
      sku: 'BELT-001'
    },
    {
      name: 'Casual Sneakers',
      category: 'Shoes',
      price: 129.99,
      stock: 12,
      color: 'White',
      size: '10',
      sku: 'SHOE-001'
    },
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }

  console.log('✓ Database seeded with products')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
