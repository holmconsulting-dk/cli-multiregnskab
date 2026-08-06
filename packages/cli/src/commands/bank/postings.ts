import { getClient } from '../../lib/client.js'
import { Command } from 'commander'
import { getBankPostingsOp } from '@holmconsulting/multiregnskab-api'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { fail, apiError } from '../../lib/error.js'

interface PostingsOptions {
  company?: string
  account?: string
  from?: string
  to?: string
}

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
  cmd
    .option('--account <xid>', 'bank account ID (required) — run mr bank accounts to find')
    .option('--from <date>', 'include postings from this date, e.g. 2026-01-01 (default: one month ago)')
    .option('--to <date>', 'include postings up to and including this date, e.g. 2026-03-31')
}

export async function postings(options: PostingsOptions, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)

  if (!options.account) fail(cmd, '--account <xid> is required. Run mr bank accounts --company <xid> to find account IDs.')
  const bankAccountXid = parseInt(options.account!, 10)
  if (isNaN(bankAccountXid)) fail(cmd, `Invalid account ID: ${options.account}`)

  const client = getClient()
  const data = await getBankPostingsOp
    .execute({ companyXid, bankAccountXid, fromDate: options.from, toDate: options.to }, client)
    .catch((e) => apiError(cmd, 'Failed to retrieve bank postings.', e))

  const items = data.bpList
  if (items.length === 0) {
    console.log('No bank postings found.')
    return
  }

  const verbose = (cmd.optsWithGlobals() as { verbose?: boolean }).verbose === true

  const col = (label: string, values: (string | null | undefined)[]) =>
    Math.max(label.length, ...values.map((v) => (v ?? '').length))

  const colId = Math.max('ID'.length, ...items.map((p) => String(p.xid).length))
  const colDate = col('Date', items.map((p) => p.bankDate))
  const colText = col('Text', items.map((p) => p.bankText))
  const colAmount = col('Amount', items.map((p) => p.bankAmount))
  const colExtra = col('ExtraText', items.map((p) => p.extraBankText))

  const idHeader = verbose ? `${'ID'.padEnd(colId)}  ` : ''
  const idDivider = verbose ? `${'-'.repeat(colId)}  ` : ''

  const header = `${idHeader}${'Date'.padEnd(colDate)}  ${'Text'.padEnd(colText)}  ${'Amount'.padEnd(colAmount)}  ExtraText`
  const divider = `${idDivider}${'-'.repeat(colDate)}  ${'-'.repeat(colText)}  ${'-'.repeat(colAmount)}  ${'-'.repeat(colExtra)}`

  console.log(header)
  console.log(divider)
  for (const p of items) {
    const idCell = verbose ? `${String(p.xid).padEnd(colId)}  ` : ''
    console.log(
      `${idCell}${p.bankDate.padEnd(colDate)}  ${p.bankText.padEnd(colText)}  ${(p.bankAmount ?? '').padEnd(colAmount)}  ${p.extraBankText ?? ''}`
    )
  }
}
