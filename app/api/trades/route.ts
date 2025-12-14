import { NextRequest, NextResponse } from 'next/server';
import { createTrade, getAllTrades } from '@/lib/db/queries';
import type { NewTradeInput } from '@/lib/types';

export async function GET() {
  try {
    const trades = getAllTrades();
    return NextResponse.json(trades);
  } catch (error) {
    console.error('GET /api/trades error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input: NewTradeInput = {
      ticker: body.ticker,
      direction: body.direction,
      setup: body.setup,
      timeframe: body.timeframe,
      invalidationPrice: parseFloat(body.invalidationPrice),
      is0DTE: Boolean(body.is0DTE),
      notes: body.notes,
    };

    const trade = createTrade(input);
    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    console.error('POST /api/trades error:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
