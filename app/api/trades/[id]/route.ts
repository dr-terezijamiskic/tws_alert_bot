import { NextRequest, NextResponse } from 'next/server';
import { getTradeById, updateTradeStatus } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trade = getTradeById(parseInt(id));

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error('GET /api/trades/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    updateTradeStatus(
      parseInt(id),
      body.status,
      body.exitNowTriggeredAt
    );

    const updatedTrade = getTradeById(parseInt(id));
    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error('PATCH /api/trades/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}
