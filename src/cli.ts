#!/usr/bin/env node
import { Command } from 'commander';
import { runCheck } from './index.js';

const program = new Command();

program
  .name('pgconn-doctor')
  .description('Postgres connection pool health diagnostic with platform-aware recommendations.')
  .version('0.0.1-pre');

program
  .command('check', { isDefault: true })
  .description('Run a one-shot health check against the target database.')
  .option('-c, --connection-string <url>', 'PostgreSQL connection string')
  .option('-H, --host <host>', 'Database host')
  .option('-p, --port <port>', 'Database port', '5432')
  .option('-U, --user <user>', 'Database user')
  .option('-d, --database <db>', 'Database name')
  .option('-W, --password <password>', 'Database password (prefer PGPASSWORD env)')
  .option('--platform <name>', 'Override auto-detected platform (rds|aurora|supabase|neon|cloudsql|azure|self-hosted)')
  .option('--format <format>', 'Output format: table | json | markdown', 'table')
  .option('-v, --verbose', 'Show all rules evaluated, not just triggered')
  .action(async (opts) => {
    try {
      await runCheck(opts);
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
