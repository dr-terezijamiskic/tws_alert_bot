import type { Trade, PriceUpdateInput, TradeStatus } from './types';

/**
 * Rules Engine Decision Status
 * - HOLD: Continue holding, no action needed
 * - SUGGEST_REDUCE: Suggest reducing position (quiet, visual only)
 * - EXIT_NOW: Invalidation triggered, must exit immediately
 */
export type RulesDecisionStatus = 'HOLD' | 'SUGGEST_REDUCE' | 'EXIT_NOW';

/**
 * Rules Engine Output
 */
export interface RulesEngineOutput {
  /** Decision status from rules engine */
  status: RulesDecisionStatus;
  /** Trade status to set in database */
  tradeStatus: TradeStatus;
  /** Reason for the decision (written as "your past self") */
  reason: string;
  /** UI hints for rendering */
  uiHints: {
    /** Whether to play alarm sound */
    playSound: boolean;
    /** Whether to show escalation UI */
    escalate: boolean;
  };
}

/**
 * RULES ENGINE
 *
 * Centralized trade decision logic. ALL trade decisions must flow through this function.
 *
 * STRICT RULES:
 * 1. EXIT_NOW can ONLY be triggered by invalidation price touch
 * 2. Reduce suggestions are quiet (no sound, no escalation, no auto-close)
 * 3. No auto-close under any circumstances
 * 4. Alarm + escalation ONLY when EXIT_NOW
 * 5. No-follow-through uses update count as candle proxy
 */
export function evaluateRules(
  trade: Trade,
  priceUpdate: PriceUpdateInput,
  updateCount: number
): RulesEngineOutput {
  // If trade is already closed, no decision needed
  if (trade.status === 'CLOSED') {
    return {
      status: 'HOLD',
      tradeStatus: 'CLOSED',
      reason: 'Trade is closed',
      uiHints: {
        playSound: false,
        escalate: false,
      },
    };
  }

  // If trade is already in EXIT_NOW, maintain that status
  if (trade.status === 'EXIT_NOW') {
    return {
      status: 'EXIT_NOW',
      tradeStatus: 'EXIT_NOW',
      reason: 'Invalidation price touched - exit immediately',
      uiHints: {
        playSound: true,
        escalate: true,
      },
    };
  }

  // ============================================
  // RULE 1: CHECK INVALIDATION (ONLY EXIT_NOW TRIGGER)
  // ============================================
  const invalidated = checkInvalidation(trade, priceUpdate.price);

  if (invalidated) {
    return {
      status: 'EXIT_NOW',
      tradeStatus: 'EXIT_NOW',
      reason: trade.direction === 'LONG'
        ? `Price dropped to ${priceUpdate.price} (invalidation: ${trade.invalidationPrice}). Your setup is broken. Exit now.`
        : `Price rose to ${priceUpdate.price} (invalidation: ${trade.invalidationPrice}). Your setup is broken. Exit now.`,
      uiHints: {
        playSound: true,
        escalate: true,
      },
    };
  }

  // ============================================
  // RULE 2: REDUCE SUGGESTIONS (QUIET, VISUAL ONLY)
  // ============================================
  const reasons: string[] = [];

  // Check for chop/unsure
  if (priceUpdate.chop) {
    reasons.push('choppy price action');
  }
  if (priceUpdate.unsure) {
    reasons.push('uncertain market conditions');
  }

  // Check for no-follow-through using update count as candle proxy
  const noFollowThrough = checkNoFollowThrough(trade, priceUpdate, updateCount);
  if (noFollowThrough) {
    reasons.push('no follow-through after entry');
  }

  // If any reduce reason exists, suggest reduce
  if (reasons.length > 0) {
    return {
      status: 'SUGGEST_REDUCE',
      tradeStatus: 'ACTIVE', // Trade remains active
      reason: `Consider reducing 50% due to ${reasons.join(' and ')}. This is a suggestion - you decide.`,
      uiHints: {
        playSound: false, // QUIET - no sound
        escalate: false,  // QUIET - no escalation
      },
    };
  }

  // ============================================
  // DEFAULT: HOLD
  // ============================================
  return {
    status: 'HOLD',
    tradeStatus: 'ACTIVE',
    reason: priceUpdate.inProfit
      ? 'Trade is in profit. Let it run according to your plan.'
      : 'Trade is active. Stick to your plan.',
    uiHints: {
      playSound: false,
      escalate: false,
    },
  };
}

/**
 * Check if invalidation price has been touched
 *
 * STRICT LOGIC:
 * - LONG/CALL: Invalidated when price <= invalidationPrice
 * - SHORT/PUT: Invalidated when price >= invalidationPrice
 */
function checkInvalidation(trade: Trade, currentPrice: number): boolean {
  if (trade.direction === 'LONG') {
    return currentPrice <= trade.invalidationPrice;
  } else {
    return currentPrice >= trade.invalidationPrice;
  }
}

/**
 * Check for no-follow-through using update count as candle proxy
 *
 * LOGIC:
 * - If not invalidated AND not in profit AND updateCount >= threshold
 * - Threshold: 3 for QQQ 0DTE, 4 for weeklies
 * - This NEVER triggers EXIT_NOW, only SUGGEST_REDUCE
 */
function checkNoFollowThrough(
  trade: Trade,
  priceUpdate: PriceUpdateInput,
  updateCount: number
): boolean {
  // Only check if trade is not in profit
  if (priceUpdate.inProfit) {
    return false;
  }

  // Determine threshold based on expiry risk
  const threshold = getNoFollowThroughThreshold(trade);

  // Trigger ONLY ONCE when threshold is reached (prevent nagging)
  return updateCount === threshold;
}

/**
 * Determine no-follow-through threshold based on expiry risk
 *
 * THRESHOLDS:
 * - 0DTE (same-day expiry): 3 updates - high theta decay, urgent exit needed
 * - Weeklies/other: 4 updates - more time to develop
 *
 * Core risk is EXPIRY, not ticker.
 */
function getNoFollowThroughThreshold(trade: Trade): number {
  // 0DTE positions need faster exits due to rapid theta decay
  if (trade.is0DTE) {
    return 3;
  }

  // Weeklies and longer-dated positions get more time
  return 4;
}
