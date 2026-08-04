import { Command } from 'commander'
import { createClient, listCustomersOp } from '@holmconsulting/multiregnskab-api'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { apiError } from '../../lib/error.js'

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
  cmd.argument('[search]', 'filter by customer name or customer number')
}

export async function list(search: string | undefined, options: { company?: string }, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)
  const client = createClient()

  const data = await listCustomersOp.execute({ companyXid, search }, client).catch((e) => apiError(cmd, 'Failed to retrieve customers.', e))

  const { customers } = data
  if (customers.length === 0) {
    console.log('No customers found.')
    return
  }

  const col = (label: string, values: (string | null | undefined)[]) =>
    Math.max(label.length, ...values.map((v) => (v ?? '').length))

  const colId = Math.max('ID'.length, ...customers.map((c) => String(c.xid).length))
  const colNum = col('Number', customers.map((c) => c.customerNumber))
  const colName = col('Name', customers.map((c) => c.customerName))
  const colCountry = col('Country', customers.map((c) => c.countryCode))
  const colCurrency = col('Currency', customers.map((c) => c.currencyCode))

  const header = `${'ID'.padEnd(colId)}  ${'Number'.padEnd(colNum)}  ${'Name'.padEnd(colName)}  ${'Country'.padEnd(colCountry)}  Currency`
  const divider = `${'-'.repeat(colId)}  ${'-'.repeat(colNum)}  ${'-'.repeat(colName)}  ${'-'.repeat(colCountry)}  ${'-'.repeat(colCurrency)}`

  console.log(header)
  console.log(divider)
  for (const c of customers) {
    console.log(
      `${String(c.xid).padEnd(colId)}  ${(c.customerNumber ?? '').padEnd(colNum)}  ${(c.customerName ?? '').padEnd(colName)}  ${(c.countryCode ?? '').padEnd(colCountry)}  ${c.currencyCode ?? ''}`
    )
  }
}
