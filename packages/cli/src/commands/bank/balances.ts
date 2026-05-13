import { Command } from 'commander'
import { createClient } from '@holmconsulting/multiregnskab-api'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { apiError } from '../../lib/error.js'

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
}

export async function balances(options: { company?: string }, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)
  const client = createClient()

  const { data, error } = await client.GET('/bankBalances/{companyXid}', {
    params: { path: { companyXid } },
  })

  if (error || !data) {
    apiError(cmd, 'Failed to retrieve bank balances.', error)
  }

  const items = data.bbList
  if (items.length === 0) {
    console.log('No bank balances found.')
    return
  }

  const col = (label: string, values: (string | null | undefined)[]) =>
    Math.max(label.length, ...values.map((v) => (v ?? '').length))

  const colName = col('Account', items.map((b) => b.bankAccountName))
  const colType = col('Type', items.map((b) => b.balanceType))
  const colAmount = col('Amount', items.map((b) => b.balanceAmount))
  const colCurrency = col('Currency', items.map((b) => b.currency))
  const colTimestamp = col('Timestamp', items.map((b) => b.timestamp))

  const header = `${'Account'.padEnd(colName)}  ${'Type'.padEnd(colType)}  ${'Amount'.padEnd(colAmount)}  ${'Currency'.padEnd(colCurrency)}  Timestamp`
  const divider = `${'-'.repeat(colName)}  ${'-'.repeat(colType)}  ${'-'.repeat(colAmount)}  ${'-'.repeat(colCurrency)}  ${'-'.repeat(colTimestamp)}`

  console.log(header)
  console.log(divider)
  for (const b of items) {
    console.log(
      `${b.bankAccountName.padEnd(colName)}  ${b.balanceType.padEnd(colType)}  ${b.balanceAmount.padEnd(colAmount)}  ${b.currency.padEnd(colCurrency)}  ${b.timestamp ?? ''}`
    )
  }
}
