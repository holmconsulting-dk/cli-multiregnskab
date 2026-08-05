# CLAUDE.md

## Project

CLI tool (`mr`) for the Multiregnskab accounting API. Built with Bun + TypeScript + Commander.js.
The API spec lives in `public-client-api-v1.yaml` and types are generated from it.

## Commands

- `bun run dev` — run from source
- `bun run build` — compile to `dist/index.js`
- `bun run generate-api` — regenerate `src/api/types.ts` from spec

## Architecture

Commands are organised into areas (e.g. `bank`, `invoices`). Each area has:
- `src/commands/<area>/index.ts` — registers subcommands via `createArea()`
- `src/commands/<area>/<command>.ts` — `setup()` defines options, action function does the work

Every area and subcommand exposes an `info` subcommand — this is the primary user-facing help.
Put usage guidance, required fields, examples, and gotchas in the `info` text, not in external docs.

## API changes

When the spec updates: replace `public-client-api-v1.yaml`, run `bun run generate-api`, update affected commands.
The spec `required` fields are not always accurate — the API may enforce additional fields at runtime.

## Releasing

Tag on main triggers the GitHub Actions release workflow. Binaries embed the tag name as version via `--define`.

## Known API quirks

- `InvoiceLine`: `amount` is always required, even when `priceEach` × `numberOfUnits` covers it
- `productTypeXid` is always required on invoice lines — `productXid` does not replace it
- No endpoint exists for listing the chart of accounts (finance accounts / kontoplan) or VAT codes. Users must look these up in the Multi-Regnskab web UI. Only `bankAccounts` (a subset) is listable.
- `Registration` has no `bankPostingXid` field — a suggested registration is not formally linked to a bank posting server-side. The `--from-bank-posting` flag in `mr registrations create` is a client-side convenience: it pre-fills `date`/`description` from the posting and validates that one line's amount matches, but nothing about the posting is sent to the API. Reconciliation happens when a user accepts the registration in Multi-Regnskab.
- `/bankPostings/{companyXid}/{bankAccountXid}` has no "get by id" endpoint — looking up a specific posting means listing a date range and filtering client-side. The server-side default range is "last month", so any client that omits `fromDateIncl`/`toDateIncl` silently caps lookups to the last month. `mr registrations create --from-bank-posting` explicitly sends a one-year window by default; `--posting-from`/`--posting-to` widen it further.
