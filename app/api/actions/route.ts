import { NextRequest, NextResponse } from 'next/server';
import { createAction } from '@/lib/db/queries';
import type { ActionType, ActionPayload } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tradeId = parseInt(body.tradeId);
    const type: ActionType = body.type;
    const payload: ActionPayload = body.payload || {};

    const action = createAction(tradeId, type, payload);
    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error('POST /api/actions error:', error);
    return NextResponse.json(
      { error: 'Failed to create action' },
      { status: 500 }
    );
  }
}
