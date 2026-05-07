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

- `Customer`: `languageCode` and `paymentTermsType` are required despite the spec not marking them as such
- `InvoiceLine`: `amount` is always required, even when `priceEach` × `numberOfUnits` covers it
- `productTypeXid` is always required on invoice lines — `productXid` does not replace it
