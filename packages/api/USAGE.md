# @holmconsulting/multiregnskab-api

Typed API client for the Multiregnskab API. Provides authentication, token lifecycle management, and typed business operations. Designed to be consumed by both the CLI tool and MCP servers.

## Installation

```bash
bun add @holmconsulting/multiregnskab-api
# or
npm install @holmconsulting/multiregnskab-api
```

## Authentication

Authentication follows a two-step pattern: obtain tokens via `loginWithPassword`, then create an authenticated client using `createClient` with storage callbacks. The client handles token refresh transparently and notifies you via `onAuthUpdated` whenever new tokens are issued.

### Step 1 — Exchange credentials for tokens

```typescript
import { loginWithPassword } from '@holmconsulting/multiregnskab-api'

const auth = await loginWithPassword(username, password)
// auth: { token, tokenExpires, refreshToken }
```

Store the returned `StoredAuth` in whatever persistence layer suits your consumer (file, database, memory).

### Step 2 — Create an authenticated client

```typescript
import { createClient } from '@holmconsulting/multiregnskab-api'

const client = createClient({
  getAuth: () => myStore.load(),          // called before each request
  onAuthUpdated: (auth) => myStore.save(auth), // called when tokens are refreshed
})
```

`getAuth` returns the current stored tokens (or `null` if not authenticated). When the access token is expired, the client automatically refreshes it and calls `onAuthUpdated` with the new tokens so you can persist them. Your consumer never needs to handle refresh manually.

### AuthenticationError

If `getAuth` returns `null` or token refresh fails, the client throws `AuthenticationError`. Import and check for it to handle auth failures distinctly from API errors:

```typescript
import { AuthenticationError } from '@holmconsulting/multiregnskab-api'

try {
  const data = await someOp.execute(input, client)
} catch (e) {
  if (e instanceof AuthenticationError) {
    // prompt re-login
  }
}
```

---

## CLI consumer example

The CLI stores tokens on disk at `~/.config/mr/auth.json`. Helper utilities `readAuth` and `writeAuth` are exported for exactly this pattern:

```typescript
import { createClient, loginWithPassword, readAuth, writeAuth } from '@holmconsulting/multiregnskab-api'

// One-time login
const auth = await loginWithPassword(username, password)
writeAuth(auth)

// Subsequent requests — disk-backed, auto-refreshing
const client = createClient({
  getAuth: readAuth,
  onAuthUpdated: writeAuth,
})
```

---

## MCP server example

The MCP server manages its own token storage (e.g. a database) and injects credentials programmatically — no disk access needed:

```typescript
import { createClient, loginWithPassword } from '@holmconsulting/multiregnskab-api'

// Initial login (once per user session)
const auth = await loginWithPassword(username, password)
await db.saveAuth(userId, auth)

// Per-request client — tokens come from and are saved to the database
const client = createClient({
  getAuth: () => db.getAuth(userId),
  onAuthUpdated: (auth) => db.saveAuth(userId, auth),
})
```

---

## Operations

Operations are named, typed, schema-bearing functions that encapsulate all API calls. Each operation validates its input and throws a descriptive `Error` on failure.

### Using operations directly

```typescript
import { listCompaniesOp, listCustomersOp, createInvoiceOp } from '@holmconsulting/multiregnskab-api'

const companies = await listCompaniesOp.execute({}, client)

const { customers } = await listCustomersOp.execute({ companyXid: 1, search: 'acme' }, client)

const invoice = await createInvoiceOp.execute({
  companyXid: 1,
  customerXid: 42,
  date: '2026-01-15',
  lines: [{ lineText: 'Consulting', amount: '5000', productTypeXid: 10 }],
}, client)
```

### Registering all operations (MCP)

`createOperations(client)` returns all operations as a uniform list ready for registration in an MCP server:

```typescript
import { createOperations } from '@holmconsulting/multiregnskab-api'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerTools(server: McpServer, client: ReturnType<typeof import('@holmconsulting/multiregnskab-api').createClient>) {
  for (const op of createOperations(client)) {
    server.registerTool(
      op.name,
      { description: op.description, inputSchema: op.inputSchema },
      async (input) => {
        try {
          const result = await op.execute(input)
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
        } catch (e) {
          return { content: [{ type: 'text', text: String(e) }], isError: true }
        }
      }
    )
  }
}
```

### Available operations

| Name | Description |
|---|---|
| `list_companies` | List all companies the user has access to |
| `list_customers` | List customers for a company, with optional search filter |
| `create_customer` | Create a new customer |
| `list_bank_accounts` | List bank accounts for a company |
| `get_bank_balances` | Get bank balances for a company |
| `get_bank_postings` | Get bank postings for a specific account and date range |
| `list_products` | List products for a company |
| `list_product_types` | List product types — provides `productTypeXid` for invoice lines |
| `list_units_of_measure` | List units of measure (DA or EN) |
| `create_invoice` | Create a new invoice, credit note, or offer |

---

## Auth utilities

These are exported for consumers that manage their own file-based storage:

| Export | Description |
|---|---|
| `readAuth()` | Read `StoredAuth` from `~/.config/mr/auth.json`, or `null` if absent |
| `writeAuth(auth)` | Write `StoredAuth` to `~/.config/mr/auth.json` |
| `clearAuth()` | Clear stored auth (logout) |

---

## Types

```typescript
import type { StoredAuth, AuthConfig, AuthenticationError, RegistrableOperation, CreateCustomerInput, CreateInvoiceInput, InvoiceLine } from '@holmconsulting/multiregnskab-api'

// Generated OpenAPI types
import type { paths, components } from '@holmconsulting/multiregnskab-api'
```
