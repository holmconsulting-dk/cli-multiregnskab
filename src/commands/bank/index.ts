import { createArea } from '../../lib/area.js'
import { setup as balancesSetup, balances } from './balances.js'
import { setup as accountsSetup, accounts } from './accounts.js'
import { setup as postingsSetup, postings } from './postings.js'

export const bankArea = createArea({
  name: 'bank',
  description: 'Bank accounts and balances',
  info: 'The bank area provides commands for viewing bank accounts, balances, and postings in Multiregnskab.',
  subcommands: [
    {
      name: 'accounts',
      description: 'List bank accounts',
      info: 'Lists all bank accounts for the given company. The account ID is required for the postings command.',
      setup: accountsSetup,
      action: accounts,
    },
    {
      name: 'balances',
      description: 'List bank account balances',
      info: 'Lists all bank account balances for the given company. Shows balance type, amount, currency, and timestamp.',
      setup: balancesSetup,
      action: balances,
    },
    {
      name: 'postings',
      description: 'List bank postings for an account',
      info: `Lists bank postings for the given bank account. Defaults to the last month.
Use --from and --to to filter by date range (ISO 8601, e.g. 2026-01-01).
Run mr bank accounts to find account IDs.

Use --verbose to include the posting ID column. Posting IDs are needed for
mr registrations create --from-bank-posting <xid>.`,
      setup: postingsSetup,
      action: postings,
    },
  ],
})
