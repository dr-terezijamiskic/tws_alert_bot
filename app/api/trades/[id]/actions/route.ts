import { NextRequest, NextResponse } from 'next/server';
import { listActionsByTradeId } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tradeId = parseInt(id);

    const actions = listActionsByTradeId(tradeId);

    return NextResponse.json(actions);
  } catch (error) {
    console.error('GET /api/trades/[id]/actions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}
