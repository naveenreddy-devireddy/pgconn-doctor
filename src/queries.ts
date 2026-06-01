/**
 * Diagnostic SQL queries. All read-only. All safe on managed Postgres
 * (RDS / Aurora / Supabase / Neon / Cloud SQL / Azure) with the standard
 * application/master user.
 *
 * Keep these as plain SQL strings — no string concatenation, no user input
 * interpolated, no DDL. If a query needs to be conditional on Postgres
 * version, prefer running multiple queries and merging results in `metrics.ts`
 * over building dynamic SQL here.
 */

export const QUERIES = {
  version: 'SELECT version()',

  maxConnections: 'SHOW max_connections',

  connectionsByState: `
    SELECT state, COUNT(*)::int AS count
    FROM pg_stat_activity
    WHERE pid <> pg_backend_pid()
    GROUP BY state
  `,

  connectionsByApplication: `
    SELECT
      COALESCE(application_name, '') AS application_name,
      COUNT(*)::int AS count
    FROM pg_stat_activity
    WHERE pid <> pg_backend_pid()
    GROUP BY application_name
    ORDER BY count DESC
    LIMIT 10
  `,

  longestIdle: `
    SELECT
      MAX(EXTRACT(EPOCH FROM (now() - state_change)))::int AS longest_idle_seconds
    FROM pg_stat_activity
    WHERE state = 'idle'
      AND pid <> pg_backend_pid()
  `,

  longestActive: `
    SELECT
      MAX(EXTRACT(EPOCH FROM (now() - query_start)))::int AS longest_active_seconds
    FROM pg_stat_activity
    WHERE state = 'active'
      AND pid <> pg_backend_pid()
  `,

  longestIdleInTransaction: `
    SELECT
      MAX(EXTRACT(EPOCH FROM (now() - state_change)))::int AS longest_idle_in_tx_seconds
    FROM pg_stat_activity
    WHERE state LIKE 'idle in transaction%'
      AND pid <> pg_backend_pid()
  `,

  pgStatStatementsEnabled: `
    SELECT EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
    ) AS enabled
  `,
} as const;
