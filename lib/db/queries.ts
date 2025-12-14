import { getDb } from './index';
import type {
  Trade,
  PriceUpdate,
  Action,
  NewTradeInput,
  PriceUpdateInput,
  ActionType,
  ActionPayload,
  TradeMetrics,
  TradeStatus,
} from '@/lib/types';

// ===== TRADE QUERIES =====

export function createTrade(input: NewTradeInput): Trade {
  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO trades (createdAt, ticker, direction, setup, timeframe, invalidationPrice, entryTime, status, notes, exitNowTriggeredAt, is0DTE)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, NULL, ?)
  `);

  const result = stmt.run(
    now,
    input.ticker.toUpperCase(),
    input.direction,
    input.setup,
    input.timeframe,
    input.invalidationPrice,
    now,
    input.notes || null,
    input.is0DTE ? 1 : 0
  );

  return getTradeById(Number(result.lastInsertRowid))!;
}

export function getTradeById(id: number): Trade | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM trades WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return undefined;

  return {
    ...row,
    invalidationPrice: Number(row.invalidationPrice),
    is0DTE: Boolean(row.is0DTE),
  };
}

export function getAllTrades(): Trade[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM trades ORDER BY createdAt DESC');
  const rows = stmt.all() as any[];

  return rows.map(row => ({
    ...row,
    invalidationPrice: Number(row.invalidationPrice),
    is0DTE: Boolean(row.is0DTE),
  }));
}

export function updateTradeStatus(
  id: number,
  status: TradeStatus,
  exitNowTriggeredAt?: string
): void {
  const db = getDb();

  if (status === 'EXIT_NOW' && exitNowTriggeredAt) {
    // Triggering EXIT_NOW - always update timestamp (handles re-triggers after override)
    const stmt = db.prepare(`
      UPDATE trades
      SET status = ?, exitNowTriggeredAt = ?
      WHERE id = ?
    `);
    stmt.run(status, exitNowTriggeredAt, id);
  } else if (status === 'CLOSED') {
    const stmt = db.prepare(`
      UPDATE trades
      SET status = ?, closedAt = ?
      WHERE id = ?
    `);
    stmt.run(status, new Date().toISOString(), id);
  } else if (status === 'ACTIVE') {
    // When returning to ACTIVE (e.g., after override), clear exitNowTriggeredAt
    // This allows a fresh EXIT_NOW episode to start if invalidation is hit again
    const stmt = db.prepare(`
      UPDATE trades
      SET status = ?, exitNowTriggeredAt = NULL
      WHERE id = ?
    `);
    stmt.run(status, id);
  } else {
    const stmt = db.prepare('UPDATE trades SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }
}

// ===== PRICE UPDATE QUERIES =====

export function createPriceUpdate(
  tradeId: number,
  input: PriceUpdateInput,
  newStatus: TradeStatus
): PriceUpdate {
  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO price_updates (tradeId, time, price, chop, unsure, inProfit, statusAfter, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    tradeId,
    now,
    input.price,
    input.chop ? 1 : 0,
    input.unsure ? 1 : 0,
    input.inProfit ? 1 : 0,
    newStatus,
    input.reason || null
  );

  return getPriceUpdateById(Number(result.lastInsertRowid))!;
}

export function getPriceUpdateById(id: number): PriceUpdate | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM price_updates WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return undefined;

  return {
    ...row,
    price: Number(row.price),
    chop: Boolean(row.chop),
    unsure: Boolean(row.unsure),
    inProfit: Boolean(row.inProfit),
  };
}

export function getPriceUpdatesByTradeId(tradeId: number): PriceUpdate[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM price_updates WHERE tradeId = ? ORDER BY time ASC');
  const rows = stmt.all(tradeId) as any[];

  return rows.map(row => ({
    ...row,
    price: Number(row.price),
    chop: Boolean(row.chop),
    unsure: Boolean(row.unsure),
    inProfit: Boolean(row.inProfit),
  }));
}

export function countPriceUpdatesByTradeId(tradeId: number): number {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM price_updates WHERE tradeId = ?');
  const result = stmt.get(tradeId) as { count: number };
  return result.count;
}

export function listPriceUpdatesByTradeId(tradeId: number, limit: number = 30): PriceUpdate[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM price_updates WHERE tradeId = ? ORDER BY time DESC LIMIT ?');
  const rows = stmt.all(tradeId, limit) as any[];

  return rows.map(row => ({
    ...row,
    price: Number(row.price),
    chop: Boolean(row.chop),
    unsure: Boolean(row.unsure),
    inProfit: Boolean(row.inProfit),
  }));
}

// ===== ACTION QUERIES =====

export function createAction(
  tradeId: number,
  type: ActionType,
  payload: ActionPayload
): Action {
  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO actions (tradeId, time, type, payload)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    tradeId,
    now,
    type,
    JSON.stringify(payload)
  );

  return getActionById(Number(result.lastInsertRowid))!;
}

export function getActionById(id: number): Action | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM actions WHERE id = ?');
  return stmt.get(id) as Action | undefined;
}

export function getActionsByTradeId(tradeId: number): Action[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM actions WHERE tradeId = ? ORDER BY time ASC');
  return stmt.all(tradeId) as Action[];
}

export function listActionsByTradeId(tradeId: number): Action[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM actions WHERE tradeId = ? ORDER BY time DESC');
  return stmt.all(tradeId) as Action[];
}

// ===== METRICS QUERIES =====

export function calculateMetrics(): TradeMetrics {
  const db = getDb();

  // Total trades
  const totalTrades = db.prepare('SELECT COUNT(*) as count FROM trades').get() as { count: number };

  // Avg exit delay (EXIT_NOW triggered -> EXIT action)
  const exitDelayResult = db.prepare(`
    SELECT AVG(
      (julianday(a.time) - julianday(t.exitNowTriggeredAt)) * 86400
    ) as avgDelay
    FROM trades t
    JOIN actions a ON a.tradeId = t.id
    WHERE t.exitNowTriggeredAt IS NOT NULL
      AND a.type = 'EXIT'
      AND a.time >= t.exitNowTriggeredAt
  `).get() as { avgDelay: number | null };

  // % EXIT_NOW ignored > 60s
  const ignoredExitNowResult = db.prepare(`
    WITH exit_delays AS (
      SELECT
        t.id,
        (julianday(a.time) - julianday(t.exitNowTriggeredAt)) * 86400 as delaySeconds
      FROM trades t
      JOIN actions a ON a.tradeId = t.id
      WHERE t.exitNowTriggeredAt IS NOT NULL
        AND a.type = 'EXIT'
        AND a.time >= t.exitNowTriggeredAt
    )
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN delaySeconds > 60 THEN 1 ELSE 0 END) as ignored
    FROM exit_delays
  `).get() as { total: number; ignored: number };

  const exitNowIgnoredPct = ignoredExitNowResult.total > 0
    ? (ignoredExitNowResult.ignored / ignoredExitNowResult.total) * 100
    : null;

  // Rule violation count (EXIT_NOW ignored > 60s)
  const ruleViolationCount = ignoredExitNowResult.ignored;

  // Avg reduce count per trade
  const reduceCountResult = db.prepare(`
    SELECT COUNT(*) as totalReduces, COUNT(DISTINCT tradeId) as tradesWithReduces
    FROM actions
    WHERE type = 'REDUCE'
  `).get() as { totalReduces: number; tradesWithReduces: number };

  const avgReduceCountPerTrade = totalTrades.count > 0
    ? reduceCountResult.totalReduces / totalTrades.count
    : 0;

  // Avg hold time (in minutes)
  const holdTimeResult = db.prepare(`
    SELECT AVG(
      (julianday(closedAt) - julianday(entryTime)) * 1440
    ) as avgHoldTime
    FROM trades
    WHERE closedAt IS NOT NULL
  `).get() as { avgHoldTime: number | null };

  return {
    totalTrades: totalTrades.count,
    avgExitDelaySeconds: exitDelayResult.avgDelay,
    exitNowIgnoredPct,
    ruleViolationCount,
    avgReduceCountPerTrade,
    avgHoldTimeMinutes: holdTimeResult.avgHoldTime,
  };
}
