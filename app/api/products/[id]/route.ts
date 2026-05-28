import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });
    if (!product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

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

    // Check for duplicate code if provided (excluding current product)
    if (body.code?.trim()) {
      const existing = await prisma.product.findUnique({
        where: { code: body.code.trim() }
      })
      if (existing && existing.id !== parseInt(id)) {
        return NextResponse.json({ error: 'This product code already exists' }, { status: 409 })
      }
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name.trim(),
        category: body.category.trim(),
        price,
        stock,
        size: body.size?.trim() || null,
        code: body.code?.trim() || null,
      },
    });
    return NextResponse.json(product);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This product code already exists' }, { status: 409 })
    }
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    // Delete related sale items first to avoid foreign key constraint errors
    await prisma.saleItem.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}

