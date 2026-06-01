# pgconn-doctor

> Diagnose Postgres connection pool health in 2 minutes. Platform-aware. Read-only. No signup.

[![status: in development](https://img.shields.io/badge/status-v0.1%20in%20development-orange)](#roadmap)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![node](https://img.shields.io/badge/node-22%2B-green)](https://nodejs.org)

**v0.1 ships June 2026.** Star to follow.

---

## The problem

Most Postgres "the database is slow" outages aren't actually slow queries — they're connection pool exhaustion. The query log looks clean. The CPU is flat. New requests just start hanging.

The diagnosis is hiding in `pg_stat_activity`, but you have to know exactly what to look at, and you have to translate the findings into platform-specific recommendations ("edit your RDS parameter group" not "edit postgresql.conf").

Existing tools are either heavy (full monitoring products like pgHero, Datadog), read-only views (`pg_activity`), or self-hosted-assumed. None give Node-developer-focused, managed-Postgres-aware, app-side guidance for the most common failure mode: **pool exhaustion under error-path connection leaks**.

I lost six hours to this exact bug. The fix was one missing `finally` block. I wrote about that debugging story → [The 6-Hour Outage That Came Down to One Missing Line](https://dev.to/naveenreddy_devireddy).

`pgconn-doctor` is the tool I wish I'd had that night.

---

## What it is

A focused CLI that:

1. Connects to any Postgres instance (managed or self-hosted)
2. Reads diagnostics from `pg_stat_activity`, `pg_stat_database`, and related views
3. Detects the platform automatically (RDS, Aurora, Supabase, Neon, Cloud SQL, Azure, self-hosted)
4. Surfaces health flags (utilization, idle counts, leaked transactions, long-running queries)
5. Outputs **specific, actionable recommendations** tailored to the detected platform

It is **read-only by design.** It doesn't kill connections. It doesn't modify settings. It tells you what's wrong and what to do about it. You decide.

## What it is not

- Not a monitoring product
- Not a competitor to Datadog, pgHero, or New Relic
- Not a paid SaaS — open source, MIT, npx-able
- Not a connection pooler (that's PgBouncer, pgpool-II, RDS Proxy)
- Not a database management UI

Think of it as `eslint` for Postgres pool health — a 2-minute diagnostic you run when something feels off.

---

## Quick start (when v0.1 ships)

```bash
# Zero install
npx pgconn-doctor --connection-string "postgres://user:pass@host:5432/db"

# Or from DATABASE_URL env var
DATABASE_URL=postgres://... npx pgconn-doctor

# Or install globally
npm install -g pgconn-doctor
pgconn-doctor
```

## Sample output (preview)

```
🔴 pgconn-doctor v0.1.0
   Connected to: db-prod-1 (PostgreSQL 15.4 on Amazon RDS)
   Detected platform: RDS

┌────────────────────────────────┬──────────────┐
│ Metric                         │ Value        │
├────────────────────────────────┼──────────────┤
│ max_connections                │ 100          │
│ Total connections              │ 91 (91%) 🔴  │
│ Active                         │ 8            │
│ Idle                           │ 76 🟠        │
│ Idle in transaction            │ 7 🟠         │
│ Longest idle connection        │ 1h 22m 🟠    │
└────────────────────────────────┴──────────────┘

🔴 CRITICAL — Connection pool at 91% of max_connections (100).
   New requests are about to start queuing or failing.

🟠 WARNING — 76 idle connections. Likely cause: app code is checking out
   connections but not releasing them on error paths.
   Common fix: wrap in try/finally, OR use pool.query() for one-shots.

📋 RECOMMENDATIONS (RDS-aware):
   To raise max_connections on RDS:
   AWS Console → RDS → Parameter Groups → modify max_connections → reboot.
```

---

## Supported platforms (v0.1)

| Platform | Detection | Tailored recommendations |
|---|---|---|
| AWS RDS | Auto | ✅ |
| AWS Aurora PostgreSQL | Auto | ✅ |
| Supabase | Auto | ✅ |
| Neon | Auto | ✅ |
| Google Cloud SQL | Auto | ✅ |
| Azure Database for PostgreSQL | Auto | ✅ |
| Self-hosted | Auto | ✅ |

Manual override: `--platform <name>` if auto-detection misses.

---

## Roadmap

### v0.1 — June 2026
- Core pool diagnostics (utilization, idle, idle-in-transaction, long-running queries)
- Platform auto-detection (7 platforms)
- Rules engine with platform-aware recommendations
- Terminal table output

### v0.2 — Q3 2026
- Watch mode (`--watch`) for live monitoring
- JSON + Markdown output for CI integration
- `pg_stat_statements` analysis (slow query attribution)
- Multi-environment config file

### v0.3 — Q4 2026
- App-side stack trace correlation (where are the leaked connections coming from?)
- Slow query log file parsing
- Slack / PagerDuty webhook output

---

## FAQ

**Does it modify anything?**
No. Read-only by design. The tool only runs SELECT queries.

**Does it require superuser?**
No. Works with the standard application/master user on managed Postgres (RDS, Aurora, etc.). Some advanced features require `rds_superuser` on RDS, but the core diagnostics work without it.

**Does it work with PgBouncer / RDS Proxy?**
Yes — it detects them and adjusts the analysis (pool exhaustion at the app layer vs. the database layer are different problems with different fixes).

**What Postgres versions are supported?**
v0.1 targets PostgreSQL 14, 15, 16. Older versions (12, 13) are out of practical support range in 2026.

**Why not just use pgHero / pg_activity / Datadog?**
- **pgHero** — Rails-based web UI, requires hosting; this is a CLI you run on demand.
- **pg_activity** — top-like read-only view; this gives recommendations, not just data.
- **Datadog** — full monitoring product; this is a 2-minute diagnostic, not a platform.

Different shape of tool, different use case.

---

## Contributing

v0.1 is being built in public over June 2026. Star to follow the launch.

Issues and feature requests welcome once v0.1 ships — see [CONTRIBUTING.md](CONTRIBUTING.md) (coming with v0.1).

---

## Built by

Naveen Reddy Devireddy — 10-year fullstack engineer, Node.js + Postgres.

- [Dev.to](https://dev.to/naveenreddy_devireddy) — writing about scaling Node + Postgres systems
- [LinkedIn](https://www.linkedin.com/in/naveen-reddy-devireddy-475a4285/)

---

## License

[MIT](LICENSE)
