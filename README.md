# cli-multiregnskab

A command-line interface for the [Multiregnskab](https://multiregnskab.dk) accounting API.

The CLI is installed as `mr` and provides commands for managing companies, customers, and invoices.

## Commands

```
mr user login          # Authenticate with your Multiregnskab credentials
mr user logout         # Remove stored credentials
mr user show           # Show current user info

mr companies list      # List accessible companies
mr companies info      # Show command help

mr customers list      # List customers for a company
mr customers create    # Create a new customer
mr customers info      # Show command help

mr invoices create     # Create an invoice, offer, or credit note
mr invoices product-types     # List available product types
mr invoices units-of-measure  # List available units of measure
mr invoices info       # Show command help
```

Credentials are stored in `~/.config/mr/auth.json`. Access tokens are refreshed automatically.

## Installation

Install globally using Bun:

```sh
bun add -g --trust git+ssh://git@github.com/holmconsulting-dk/cli-multiregnskab.git#first-draft
```

## Development

**Prerequisites:** [Bun](https://bun.sh)

```sh
bun install       # Install dependencies
bun run dev       # Run CLI from source (e.g. bun run dev user login)
bun run build     # Compile TypeScript to dist/
```

To regenerate TypeScript types from the OpenAPI spec:

```sh
bun run generate-api
```

The types are generated from `public-client-api-v1.yaml` into `src/api/types.ts`.
