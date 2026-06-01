import type { Client } from 'pg';
import { QUERIES } from './queries.js';

export interface Metrics {
  maxConnections: number;
  total: number;
  active: number;
  idle: number;
  idleInTransaction: number;
  waiting: number;
  utilizationPct: number;
  longestIdleSec: number;
  longestActiveSec: number;
  longestIdleInTxSec: number;
  byApplication: Array<{ applicationName: string; count: number }>;
  pgStatStatementsEnabled: boolean;
}

export async function gatherMetrics(client: Client): Promise<Metrics> {
  const [
    maxConnRes,
    stateRes,
    appRes,
    idleRes,
    activeRes,
    idleTxRes,
    pgssRes,
  ] = await Promise.all([
    client.query<{ max_connections: string }>(QUERIES.maxConnections),
    client.query<{ state: string | null; count: number }>(QUERIES.connectionsByState),
    client.query<{ application_name: string; count: number }>(QUERIES.connectionsByApplication),
    client.query<{ longest_idle_seconds: number | null }>(QUERIES.longestIdle),
    client.query<{ longest_active_seconds: number | null }>(QUERIES.longestActive),
    client.query<{ longest_idle_in_tx_seconds: number | null }>(QUERIES.longestIdleInTransaction),
    client.query<{ enabled: boolean }>(QUERIES.pgStatStatementsEnabled),
  ]);

  const maxConnections = Number(maxConnRes.rows[0]?.max_connections ?? 100);

  let active = 0;
  let idle = 0;
  let idleInTransaction = 0;
  let waiting = 0;
  let total = 0;

  for (const row of stateRes.rows) {
    total += row.count;
    if (row.state === 'active') active += row.count;
    else if (row.state === 'idle') idle += row.count;
    else if (row.state?.startsWith('idle in transaction')) idleInTransaction += row.count;
    else if (row.state === null) waiting += row.count;
  }

  return {
    maxConnections,
    total,
    active,
    idle,
    idleInTransaction,
    waiting,
    utilizationPct: maxConnections === 0 ? 0 : Math.round((total / maxConnections) * 100),
    longestIdleSec: idleRes.rows[0]?.longest_idle_seconds ?? 0,
    longestActiveSec: activeRes.rows[0]?.longest_active_seconds ?? 0,
    longestIdleInTxSec: idleTxRes.rows[0]?.longest_idle_in_tx_seconds ?? 0,
    byApplication: appRes.rows.map((r) => ({
      applicationName: r.application_name || '(unset)',
      count: r.count,
    })),
    pgStatStatementsEnabled: pgssRes.rows[0]?.enabled ?? false,
  };
}
