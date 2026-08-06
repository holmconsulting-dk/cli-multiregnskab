# CLAUDE.md

## Project

Bun workspace monorepo with two packages:

- **`packages/api`** (`@holmconsulting/multiregnskab-api`) — typed openapi-fetch client, auth utilities, and generated types. Independently consumable by MCP servers and other integrations.
- **`packages/cli`** (`@holmconsulting/cli-multiregnskab`) — CLI tool (`mr`) built with Commander.js. Depends on `packages/api` via `workspace:*`.

The API spec lives in `public-client-api-v1.yaml` (repo root, shared source of truth).

## Commands

Run from repo root:

- `bun run dev` — run CLI from source
- `bun run build` — build both packages (api first, then cli binary)
- `bun run generate-api` — regenerate `packages/api/src/types.ts` from spec
- `bun run test` — run CLI tests

Or scoped:

- `bun run --cwd packages/api build` — compile api to `packages/api/dist/`
- `bun run --cwd packages/cli build` — compile cli binary to `packages/cli/dist/`
- `bun run --cwd packages/api pack` — build a local `.tgz` for testing outside the workspace (e.g. by the MCP server repo); not committed, gitignored

## Architecture

### `packages/api`

- `src/client.ts` — openapi-fetch client, auth middleware, token refresh, auth file I/O
- `src/types.ts` — auto-generated from `public-client-api-v1.yaml`
- `src/index.ts` — public exports: `createClient`, `createUnauthenticatedClient`, `readAuth`, `writeAuth`, `clearAuth`, types

### `packages/cli`

Commands are organised into areas (e.g. `bank`, `invoices`). Each area has:
- `src/commands/<area>/index.ts` — registers subcommands via `createArea()`
- `src/commands/<area>/<command>.ts` — `setup()` defines options, action function does the work

Every area and subcommand exposes an `info` subcommand — this is the primary user-facing help.
Put usage guidance, required fields, examples, and gotchas in the `info` text, not in external docs.

## API changes

When the spec updates: replace `public-client-api-v1.yaml`, run `bun run generate-api`, update affected commands.
The spec `required` fields are not always accurate — the API may enforce additional fields at runtime.

## Releasing

Two independent release tracks, both triggered by tag push:

- `v*` tags → GitHub Actions builds CLI binaries for macOS arm64/x64, Linux x64, Windows x64
- `api-v*` tags → GitHub Actions publishes `@holmconsulting/multiregnskab-api` to GitHub Packages

## Known API quirks

- `InvoiceLine`: `amount` is always required, even when `priceEach` × `numberOfUnits` covers it
- `productTypeXid` is always required on invoice lines — `productXid` does not replace it
- No endpoint exists for listing the chart of accounts (finance accounts / kontoplan) or VAT codes. Users must look these up in the Multi-Regnskab web UI. Only `bankAccounts` (a subset) is listable.
- `Registration` has no `bankPostingXid` field — a suggested registration is not formally linked to a bank posting server-side. The `--from-bank-posting` flag in `mr registrations create` is a client-side convenience: it pre-fills `date`/`description` from the posting and validates that one line's amount matches, but nothing about the posting is sent to the API. Reconciliation happens when a user accepts the registration in Multi-Regnskab.
- `/bankPostings/{companyXid}/{bankAccountXid}` has no "get by id" endpoint — looking up a specific posting means listing a date range and filtering client-side. The server-side default range is "last month", so any client that omits `fromDateIncl`/`toDateIncl` silently caps lookups to the last month. `mr registrations create --from-bank-posting` explicitly sends a one-year window by default; `--posting-from`/`--posting-to` widen it further.
