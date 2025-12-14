import { NextResponse } from 'next/server';
import { calculateMetrics } from '@/lib/db/queries';

export async function GET() {
  try {
    const metrics = calculateMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('GET /api/metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate metrics' },
      { status: 500 }
    );
  }
}
