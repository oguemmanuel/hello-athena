import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateReceiptNumber } from '@/lib/utils'

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(sales)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // body: { items: [{productId, quantity, price}], paymentMethod }

    const receiptNumber = generateReceiptNumber()
    const total = body.items.reduce(
      (sum: number, item: { quantity: number; price: number }) =>
        sum + item.quantity * item.price, 0
    )

    const sale = await prisma.$transaction(async (tx) => {
      // Deduct stock for each item
      for (const item of body.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`)
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      }

      // Create sale record
      return tx.sale.create({
        data: {
          receiptNumber,
          total,
          paymentMethod: body.paymentMethod || 'cash',
          items: {
            create: body.items.map((item: { productId: number; quantity: number; price: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            }))
          }
        },
        include: { items: { include: { product: true } } }
      })
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create sale'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
