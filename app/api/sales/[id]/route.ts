import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const saleId = parseInt(id)
  if (isNaN(saleId)) return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 })

  try {
    await prisma.$transaction(async (tx) => {
      // Get sale items to restore stock
      const items = await tx.saleItem.findMany({ where: { saleId } })

      // Restore stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }

      // Delete sale items first, then the sale
      await tx.saleItem.deleteMany({ where: { saleId } })
      await tx.sale.delete({ where: { id: saleId } })
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
