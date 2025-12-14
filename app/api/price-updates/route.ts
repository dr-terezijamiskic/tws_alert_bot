import { NextRequest, NextResponse } from 'next/server';
import {
  createPriceUpdate,
  getTradeById,
  countPriceUpdatesByTradeId,
  updateTradeStatus,
} from '@/lib/db/queries';
import type { PriceUpdateInput } from '@/lib/types';
import { evaluateRules } from '@/lib/rulesEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tradeId = parseInt(body.tradeId);

    // ============================================
    // STEP 1: Load trade
    // ============================================
    const trade = getTradeById(tradeId);
    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    const input: PriceUpdateInput = {
      price: parseFloat(body.price),
      chop: Boolean(body.chop),
      unsure: Boolean(body.unsure),
      inProfit: Boolean(body.inProfit),
      reason: body.reason,
    };

    // Get current update count (before adding this one)
    const currentUpdateCount = countPriceUpdatesByTradeId(tradeId);
    const updateCount = currentUpdateCount + 1;

    // ============================================
    // STEP 2: Call rules engine (ALL decision logic)
    // ============================================
    const decision = evaluateRules(trade, input, updateCount);

    // ============================================
    // STEP 3: Persist price update with decision status
    // ============================================
    const priceUpdate = createPriceUpdate(tradeId, input, decision.tradeStatus);

    // ============================================
    // STEP 4: PATCH trade to EXIT_NOW if rules engine decided it
    // ============================================
    if (decision.tradeStatus === 'EXIT_NOW' && trade.status !== 'EXIT_NOW') {
      updateTradeStatus(tradeId, 'EXIT_NOW', new Date().toISOString());
    }

    // Return both the price update and the decision
    return NextResponse.json({
      priceUpdate,
      decision,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/price-updates error:', error);
    return NextResponse.json(
      { error: 'Failed to create price update' },
      { status: 500 }
    );
  }
}
