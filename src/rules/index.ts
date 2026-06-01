import type { Metrics } from '../metrics.js';
import type { Platform } from '../platform.js';

export type Severity = 'info' | 'warning' | 'critical';

export interface Finding {
  id: string;
  severity: Severity;
  message: string;
  recommendation?: string;
}

export interface Rule {
  id: string;
  evaluate: (metrics: Metrics, platform: Platform) => Finding | null;
}

// ---- Platform-specific advice helpers --------------------------------

function raiseMaxConnectionsAdvice(platform: Platform): string {
  switch (platform) {
    case 'rds':
    case 'aurora':
      return 'AWS Console → RDS → Parameter Groups → modify `max_connections` → reboot the instance.';
    case 'cloudsql':
      return 'GCP Console → Cloud SQL → Edit instance → Flags → max_connections → save (causes restart).';
    case 'azure':
      return 'Azure Portal → Database for PostgreSQL → Server parameters → max_connections → save.';
    case 'supabase':
    case 'neon':
      return 'Upgrade your plan tier or contact support — managed pool sizes are tied to compute size on Supabase/Neon.';
    case 'self-hosted':
    default:
      return 'Edit `postgresql.conf` → set `max_connections = <new value>` → restart Postgres.';
  }
}

// ---- Rules -----------------------------------------------------------

const utilizationCritical: Rule = {
  id: 'pool-utilization-critical',
  evaluate: (m, p) => {
    if (m.utilizationPct < 90) return null;
    return {
      id: 'pool-utilization-critical',
      severity: 'critical',
      message: `Connection pool at ${m.utilizationPct}% of max_connections (${m.maxConnections}). New requests are about to start queuing or failing.`,
      recommendation: raiseMaxConnectionsAdvice(p),
    };
  },
};

const utilizationWarning: Rule = {
  id: 'pool-utilization-warning',
  evaluate: (m) => {
    if (m.utilizationPct < 70 || m.utilizationPct >= 90) return null;
    return {
      id: 'pool-utilization-warning',
      severity: 'warning',
      message: `Connection pool at ${m.utilizationPct}% of max_connections (${m.maxConnections}). Approaching saturation.`,
      recommendation: 'Audit `pool.connect()` callsites for missing `client.release()` in error paths.',
    };
  },
};

const highIdleCount: Rule = {
  id: 'high-idle-count',
  evaluate: (m) => {
    if (m.idle <= Math.floor(m.maxConnections * 0.5)) return null;
    return {
      id: 'high-idle-count',
      severity: 'warning',
      message: `${m.idle} idle connections (${Math.round((m.idle / m.maxConnections) * 100)}% of max). Likely cause: app code is checking out connections but not releasing them on error paths.`,
      recommendation: 'Wrap `pool.connect()` calls in try/finally with `client.release()` — or switch one-shot queries to `pool.query()`.',
    };
  },
};

const longIdleInTransaction: Rule = {
  id: 'long-idle-in-transaction',
  evaluate: (m) => {
    if (m.idleInTransaction === 0 || m.longestIdleInTxSec <= 300) return null;
    return {
      id: 'long-idle-in-transaction',
      severity: 'warning',
      message: `${m.idleInTransaction} connections in 'idle in transaction' state. Longest: ${Math.round(m.longestIdleInTxSec / 60)} minutes.`,
      recommendation: 'BEGIN issued without COMMIT/ROLLBACK in an error path. Find with: `SELECT * FROM pg_stat_activity WHERE state LIKE \'idle in transaction%\';`',
    };
  },
};

const longestIdleConnection: Rule = {
  id: 'longest-idle-leak',
  evaluate: (m) => {
    if (m.longestIdleSec < 3600) return null;
    return {
      id: 'longest-idle-leak',
      severity: 'warning',
      message: `Longest idle connection: ${Math.round(m.longestIdleSec / 60)} minutes. Almost certainly a leak.`,
      recommendation: 'Audit `pool.connect()` callsites for missing `client.release()` in error paths.',
    };
  },
};

const longRunningQuery: Rule = {
  id: 'long-running-query',
  evaluate: (m) => {
    if (m.longestActiveSec < 60) return null;
    return {
      id: 'long-running-query',
      severity: 'warning',
      message: `Longest active query: ${m.longestActiveSec} seconds.`,
      recommendation: 'Find with: `SELECT pid, query, state, query_start FROM pg_stat_activity WHERE state = \'active\' ORDER BY query_start ASC LIMIT 10;`',
    };
  },
};

const pgStatStatementsMissing: Rule = {
  id: 'pg-stat-statements-missing',
  evaluate: (m, p) => {
    if (m.pgStatStatementsEnabled) return null;
    return {
      id: 'pg-stat-statements-missing',
      severity: 'info',
      message: '`pg_stat_statements` extension is not enabled. Slow query attribution will be limited in v0.2.',
      recommendation:
        p === 'rds' || p === 'aurora'
          ? 'Enable via RDS Parameter Group: set `shared_preload_libraries` to include `pg_stat_statements` → reboot.'
          : p === 'self-hosted'
            ? 'Add `pg_stat_statements` to `shared_preload_libraries` in postgresql.conf, restart Postgres, then `CREATE EXTENSION pg_stat_statements;`'
            : 'See your managed Postgres docs for enabling pg_stat_statements.',
    };
  },
};

const waitingConnections: Rule = {
  id: 'waiting-connections',
  evaluate: (m) => {
    if (m.waiting === 0) return null;
    return {
      id: 'waiting-connections',
      severity: 'warning',
      message: `${m.waiting} connections in waiting state. Queries blocked on locks or pool acquisition.`,
      recommendation: 'Inspect with: `SELECT * FROM pg_stat_activity WHERE wait_event_type IS NOT NULL;`',
    };
  },
};

export const RULES: Rule[] = [
  utilizationCritical,
  utilizationWarning,
  highIdleCount,
  longIdleInTransaction,
  longestIdleConnection,
  longRunningQuery,
  waitingConnections,
  pgStatStatementsMissing,
];

export function evaluateRules(metrics: Metrics, platform: Platform): Finding[] {
  return RULES.map((r) => r.evaluate(metrics, platform)).filter((f): f is Finding => f !== null);
}
