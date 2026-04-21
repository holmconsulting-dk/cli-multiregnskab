import { createArea } from '../../lib/area.js'
import { setup as balancesSetup, balances } from './balances.js'

export const bankArea = createArea({
  name: 'bank',
  description: 'Bank balances',
  info: 'The bank area provides commands for viewing bank account balances in Multiregnskab.',
  subcommands: [
    {
      name: 'balances',
      description: 'List bank account balances',
      info: 'Lists all bank account balances for the given company. Shows balance type, amount, currency, and timestamp.',
      setup: balancesSetup,
      action: balances,
    },
  ],
})
