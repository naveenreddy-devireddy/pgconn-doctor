# Roadmap

## v0.1 — June 2026 (target ship: June 28)

**Goal:** Boring, narrow, shippable in one focused weekend. The first cut anyone can `npx` to get a useful diagnostic.

### Must-have for v0.1
- [ ] Connect to Postgres via `--connection-string` or `DATABASE_URL`
- [ ] Run core diagnostic queries against `pg_stat_activity` and `pg_stat_database`
- [ ] Calculate utilization %, idle counts, idle-in-transaction counts
- [ ] Detect longest-running idle connection and longest-running active query
- [ ] Platform auto-detection: RDS, Aurora, Supabase, Neon, Cloud SQL, Azure, self-hosted
- [ ] Rules engine with at least 8 rules
- [ ] Platform-aware recommendations (RDS-specific guidance differs from self-hosted)
- [ ] Terminal table output (default)
- [ ] `--verbose` flag to show all rules evaluated, not just triggered
- [ ] Graceful handling of permission errors (not-superuser scenarios)
- [ ] README with sample output and quick start
- [ ] LICENSE (MIT)
- [ ] npm publish under name `pgconn-doctor`

### Explicitly OUT of v0.1
- Watch mode (`--watch`)
- JSON / Markdown output formats
- `pg_stat_statements` analysis
- App-side stack trace correlation
- Config files
- Web UI
- Killing connections (NEVER — read-only by design)

---

## v0.2 — Q3 2026

- [ ] `--watch` mode for live updating dashboard
- [ ] `--format json` for CI integration
- [ ] `--format markdown` for Slack/docs paste
- [ ] `pg_stat_statements` analysis (slow query attribution to specific apps)
- [ ] Multi-environment config file (`pgconn-doctor.config.js`)
- [ ] 5+ additional rules based on community feedback
- [ ] Postgres version coverage extension (test against PG 14, 15, 16, 17)

---

## v0.3 — Q4 2026

- [ ] App-side stack trace correlation — *where* are the leaked connections coming from in the code?
- [ ] Slow query log file parsing
- [ ] Slack webhook output
- [ ] PagerDuty webhook output
- [ ] MCP server wrapper (so Claude / Cursor can call pgconn-doctor as a tool)

---

## Never

- Killing connections
- Modifying database settings
- A web UI / paid SaaS
- Becoming another full monitoring product
