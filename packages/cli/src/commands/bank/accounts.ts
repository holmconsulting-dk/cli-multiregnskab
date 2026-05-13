import { Command } from 'commander'
import { createClient } from '@holmconsulting/multiregnskab-api'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { apiError } from '../../lib/error.js'

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
}

export async function accounts(options: { company?: string }, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)
  const client = createClient()

  const { data, error } = await client.GET('/bankAccounts/{companyXid}', {
    params: { path: { companyXid } },
  })

  if (error || !data) {
    apiError(cmd, 'Failed to retrieve bank accounts.', error)
  }

  const items = data.accounts ?? []
  if (items.length === 0) {
    console.log('No bank accounts found.')
    return
  }

  const col = (label: string, values: (string | null | undefined)[]) =>
    Math.max(label.length, ...values.map((v) => (v ?? '').length))

  const colId = Math.max('ID'.length, ...items.map((a) => String(a.xid).length))
  const colName = col('Name', items.map((a) => a.name))
  const colCurrency = col('Currency', items.map((a) => a.currency))
  const colBankId = col('BankId', items.map((a) => a.banksIdentification))

  const header = `${'ID'.padEnd(colId)}  ${'Name'.padEnd(colName)}  ${'Currency'.padEnd(colCurrency)}  BankId`
  const divider = `${'-'.repeat(colId)}  ${'-'.repeat(colName)}  ${'-'.repeat(colCurrency)}  ${'-'.repeat(colBankId)}`

  console.log(header)
  console.log(divider)
  for (const a of items) {
    console.log(
      `${String(a.xid).padEnd(colId)}  ${a.name.padEnd(colName)}  ${a.currency.padEnd(colCurrency)}  ${a.banksIdentification ?? ''}`
    )
  }
}
