# Contributing to pgconn-doctor

Thanks for your interest! `pgconn-doctor` is being built in public over June 2026. Once v0.1 ships, contributions are very welcome.

## Before opening an issue

1. Search existing issues — your problem may already be reported.
2. For bugs, include the output of `pgconn-doctor --version` and your Postgres version (`SELECT version();`).
3. For feature requests, describe the *problem* you're solving, not just the feature.

## Development setup

```bash
git clone https://github.com/naveenreddy-devireddy/pgconn-doctor.git
cd pgconn-doctor
npm install
npm run dev -- --connection-string "postgres://localhost:5432/your_test_db"
```

You'll need a local Postgres for development. Quick start with Docker:

```bash
docker run -d --name pg-test \
  -e POSTGRES_PASSWORD=test \
  -p 5432:5432 \
  postgres:16
```

## Testing

```bash
npm test           # run all tests
npm run test:watch # watch mode
```

## Code style

- TypeScript strict mode
- ESLint default config
- No `any` without a comment explaining why
- Each new rule lives in its own file under `src/rules/`

## What's in scope

- New diagnostic rules
- Additional platform detection (managed Postgres services)
- Better recommendations for existing rules
- Bug fixes
- Test coverage

## What's out of scope

- Killing connections or modifying any database state — `pgconn-doctor` is **read-only by design**
- Web UI / dashboard
- Authentication (we connect with whatever credentials you pass in)
- Anything that turns this into a monitoring product

When in doubt, open a discussion before a PR.

## Releasing

v0.x releases follow [Semantic Versioning](https://semver.org/). Maintainer responsibility.
