import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name?.trim() || !body.category?.trim()) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    const price = parseFloat(body.price)
    const stock = parseInt(body.stock)

    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
    }

    if (isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: 'Stock must be a non-negative number' }, { status: 400 })
    }

    // Check for duplicate code if provided
    if (body.code?.trim()) {
      const existing = await prisma.product.findUnique({
        where: { code: body.code.trim() }
      })
      if (existing) {
        return NextResponse.json({ error: 'This product code already exists' }, { status: 409 })
      }
    }

    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        category: body.category.trim(),
        price,
        stock,
        size: body.size?.trim() || null,
        code: body.code?.trim() || null,
      }
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This product code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

