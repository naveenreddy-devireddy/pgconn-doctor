import chalk from 'chalk';
import Table from 'cli-table3';
import type { Metrics } from '../metrics.js';
import type { Platform } from '../platform.js';
import type { Finding } from '../rules/index.js';

interface RenderInput {
  platform: Platform;
  metrics: Metrics;
  findings: Finding[];
  verbose: boolean;
}

const severityColor = {
  info: chalk.blue,
  warning: chalk.yellow,
  critical: chalk.red,
};

const severityIcon = {
  info: 'ℹ',
  warning: '⚠',
  critical: '✖',
};

export function renderTable({ platform, metrics, findings }: RenderInput): void {
  const overallIcon =
    findings.some((f) => f.severity === 'critical')
      ? chalk.red('✖')
      : findings.some((f) => f.severity === 'warning')
        ? chalk.yellow('⚠')
        : chalk.green('✓');

  console.log();
  console.log(`${overallIcon} ${chalk.bold('pgconn-doctor')} v0.0.1-pre`);
  console.log(`   Detected platform: ${chalk.cyan(platform)}`);
  console.log();

  const table = new Table({
    head: [chalk.bold('Metric'), chalk.bold('Value')],
    style: { head: [], border: ['gray'] },
  });

  table.push(
    ['max_connections', String(metrics.maxConnections)],
    ['Total connections', `${metrics.total} (${metrics.utilizationPct}%)`],
    ['Active', String(metrics.active)],
    ['Idle', String(metrics.idle)],
    ['Idle in transaction', String(metrics.idleInTransaction)],
    ['Waiting', String(metrics.waiting)],
    ['Longest idle (sec)', String(metrics.longestIdleSec)],
    ['Longest active query (sec)', String(metrics.longestActiveSec)],
  );

  console.log(table.toString());
  console.log();

  if (findings.length === 0) {
    console.log(chalk.green('✓ No issues detected.'));
    return;
  }

  console.log(chalk.bold('Findings:'));
  console.log();

  for (const f of findings) {
    const color = severityColor[f.severity];
    const icon = severityIcon[f.severity];
    console.log(color(`${icon} ${f.severity.toUpperCase()} — ${f.message}`));
    if (f.recommendation) {
      console.log(`   ${chalk.dim(f.recommendation)}`);
    }
    console.log();
  }
}
