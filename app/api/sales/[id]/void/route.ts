import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const saleId = parseInt(id)
  if (isNaN(saleId)) return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 })

  let reason = ''
  try {
    const body = await req.json()
    reason = (body?.reason || '').toString().trim()
  } catch {}

  try {
    const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } })
    if (!sale) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    if (sale.voided) return NextResponse.json({ error: 'Transaction already voided' }, { status: 400 })

    const now = new Date()
    const sameDay = sale.createdAt.getFullYear() === now.getFullYear()
      && sale.createdAt.getMonth() === now.getMonth()
      && sale.createdAt.getDate() === now.getDate()
    if (!sameDay) {
      return NextResponse.json({ error: 'Only same-day transactions can be voided' }, { status: 403 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
      return tx.sale.update({
        where: { id: saleId },
        data: { voided: true, voidedAt: now, voidReason: reason || null },
        include: { items: { include: { product: true } } },
      })
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to void transaction' }, { status: 500 })
  }
}
