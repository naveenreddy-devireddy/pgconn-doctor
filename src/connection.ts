import pg from 'pg';

const { Client } = pg;

export interface ConnectionOptions {
  connectionString?: string;
  host?: string;
  port?: string | number;
  user?: string;
  password?: string;
  database?: string;
}

/**
 * Build a Postgres client from CLI options, env vars, or a direct connection
 * string. Priority order:
 *   1. --connection-string (or DATABASE_URL env var)
 *   2. Individual --host / --port / --user / --database flags
 *   3. PGHOST / PGPORT / PGUSER / PGDATABASE env vars (handled by node-pg)
 */
export async function connect(opts: ConnectionOptions): Promise<pg.Client> {
  const connectionString = opts.connectionString ?? process.env.DATABASE_URL;

  const client = connectionString
    ? new Client({ connectionString })
    : new Client({
        host: opts.host,
        port: typeof opts.port === 'string' ? Number(opts.port) : opts.port,
        user: opts.user,
        password: opts.password ?? process.env.PGPASSWORD,
        database: opts.database,
      });

  await client.connect();
  return client;
}
