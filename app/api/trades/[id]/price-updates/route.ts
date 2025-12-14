import { NextRequest, NextResponse } from 'next/server';
import { listPriceUpdatesByTradeId } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tradeId = parseInt(id);

    // Get limit from query params, default to 30
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30');

    const priceUpdates = listPriceUpdatesByTradeId(tradeId, limit);

    return NextResponse.json(priceUpdates);
  } catch (error) {
    console.error('GET /api/trades/[id]/price-updates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price updates' },
      { status: 500 }
    );
  }
}
