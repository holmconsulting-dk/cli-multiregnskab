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
