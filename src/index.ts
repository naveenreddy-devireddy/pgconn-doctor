/**
 * pgconn-doctor
 *
 * Public entry point. Run a health check against a Postgres instance and
 * print a platform-aware diagnostic report.
 *
 * v0.0.1-pre — scaffold only. Real implementation lands in v0.1 (June 2026).
 */

import { connect, type ConnectionOptions } from './connection.js';
import { detectPlatform, isPlatform, PLATFORMS, type Platform } from './platform.js';
import { gatherMetrics } from './metrics.js';
import { evaluateRules } from './rules/index.js';
import { renderTable } from './format/table.js';

export interface CheckOptions extends ConnectionOptions {
  platform?: string;
  format?: 'table' | 'json' | 'markdown';
  verbose?: boolean;
}

export async function runCheck(opts: CheckOptions): Promise<void> {
  const client = await connect(opts);

  try {
    let platform: Platform;
    if (opts.platform) {
      if (!isPlatform(opts.platform)) {
        throw new Error(
          `Invalid --platform "${opts.platform}". Must be one of: ${PLATFORMS.join(', ')}`,
        );
      }
      platform = opts.platform;
    } else {
      platform = await detectPlatform(client);
    }

    const metrics = await gatherMetrics(client);
    const findings = evaluateRules(metrics, platform);

    if (opts.format === 'json') {
      console.log(JSON.stringify({ platform, metrics, findings }, null, 2));
    } else if (opts.format === 'markdown') {
      // v0.2 — markdown output
      console.log('Markdown output is planned for v0.2.');
    } else {
      renderTable({ platform, metrics, findings, verbose: opts.verbose ?? false });
    }
  } finally {
    await client.end();
  }
}
