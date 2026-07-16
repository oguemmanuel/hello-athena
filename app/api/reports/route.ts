import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const month = parseInt(
      searchParams.get("month") || String(new Date().getMonth() + 1),
    );
    const year = parseInt(
      searchParams.get("year") || String(new Date().getFullYear()),
    );

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        voided: false,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

    const totalTransactions = sales.length;

    const totalItemsSold = sales.reduce(
      (sum, sale) => sum + sale.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );

    // ✅ FIXED: productMap uses string key + null safety
    const productMap: Record<
      string,
      {
        name: string;
        code?: string;
        quantity: number;
        revenue: number;
      }
    > = {};

    for (const sale of sales) {
      for (const item of sale.items) {
        const productId = item.productId;

        // 🚨 prevent null crash
        if (!productId) continue;

        if (!productMap[productId]) {
          productMap[productId] = {
            name: item.product.name,
            code: item.product.code ?? undefined,
            quantity: 0,
            revenue: 0,
          };
        }

        productMap[productId].quantity += item.quantity;
        productMap[productId].revenue += item.quantity * item.price;
      }
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return NextResponse.json({
      month,
      year,
      totalRevenue,
      totalTransactions,
      totalItemsSold,
      topProducts,
      sales,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
