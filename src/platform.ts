import type { Client } from 'pg';

export const PLATFORMS = [
  'rds',
  'aurora',
  'supabase',
  'neon',
  'cloudsql',
  'azure',
  'self-hosted',
] as const;

export type Platform = (typeof PLATFORMS)[number];

/**
 * Type guard — returns true if the given string is a valid Platform.
 * Use to safely narrow user-supplied input (e.g. the --platform CLI flag).
 */
export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

/**
 * Detect the underlying managed Postgres platform from `version()` + the
 * server's reported hostname. Falls back to 'self-hosted' if nothing matches.
 *
 * Detection signals are deliberately conservative — false positives are worse
 * than a 'self-hosted' fallback because they lead to wrong recommendations.
 */
export async function detectPlatform(client: Client): Promise<Platform> {
  const [{ version }] = (await client.query<{ version: string }>('SELECT version()')).rows;

  // version() exposes the kernel/distribution suffix on managed platforms.
  if (/Amazon Aurora/i.test(version)) return 'aurora';
  if (/Amazon RDS/i.test(version)) return 'rds';
  if (/Google/i.test(version)) return 'cloudsql';
  if (/Microsoft Corporation/i.test(version) || /Azure/i.test(version)) return 'azure';

  // Supabase / Neon don't currently expose themselves in version(),
  // so fall back to hostname-based detection where available.
  // TODO(v0.1): inspect `inet_server_addr()` and connection hostname.

  return 'self-hosted';
}
