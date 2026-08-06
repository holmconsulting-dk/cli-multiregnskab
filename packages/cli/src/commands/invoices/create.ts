import { getClient } from '../../lib/client.js'
import { Command } from 'commander'
import { readFileSync, existsSync } from 'fs'
import { createInvoiceOp } from '@holmconsulting/multiregnskab-api'
import type { InvoiceLine } from '@holmconsulting/multiregnskab-api'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { fail, apiError } from '../../lib/error.js'

interface CreateOptions {
  company?: string
  customer?: string
  date?: string
  lines?: string
  title?: string
  creditNote?: boolean
  offer?: boolean
  reverseCharge?: boolean
  linesHaveProductId?: boolean
  linesHaveNumberAndPrice?: boolean
}

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
  cmd
    .option('--customer <xid>', 'customer ID (required)')
    .option('--date <date>', 'invoice date, e.g. 2026-03-07 (required)')
    .option('--lines <file>', 'path to JSON file containing invoice lines (required)')
    .option('--title <title>', 'invoice title')
    .option('--credit-note', 'create as credit note instead of invoice')
    .option('--offer', 'create as offer instead of invoice')
    .option('--reverse-charge', 'show reverse charge on the invoice')
    .option('--lines-have-product-id', 'show product ID column on invoice lines')
    .option('--lines-have-number-and-price', 'show quantity and unit price columns on invoice lines')
}

export async function create(options: CreateOptions, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)

  if (!options.customer) fail(cmd, '--customer <xid> is required')
  if (!options.date) fail(cmd, '--date <date> is required')
  if (!options.lines) fail(cmd, '--lines <file> is required. Provide a path to a JSON file with invoice lines.')

  const customerXid = parseInt(options.customer!, 10)
  if (isNaN(customerXid)) fail(cmd, `Invalid customer ID: ${options.customer}`)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date!)) {
    fail(cmd, `Invalid date format: ${options.date}. Expected YYYY-MM-DD.`)
  }

  if (!existsSync(options.lines!)) {
    fail(cmd, `Lines file not found: ${options.lines}`)
  }

  let lines: InvoiceLine[]
  try {
    lines = JSON.parse(readFileSync(options.lines!, 'utf-8')) as InvoiceLine[]
  } catch {
    fail(cmd, `Failed to parse lines file: ${options.lines}. Ensure it is valid JSON.`)
  }

  const client = getClient()
  const result = await createInvoiceOp
    .execute(
      {
        companyXid,
        customerXid,
        date: options.date!,
        lines: lines!,
        ...(options.title && { title: options.title }),
        creditNote: options.creditNote ?? false,
        offer: options.offer ?? false,
        reverseCharge: options.reverseCharge ?? false,
        linesHaveProductId: options.linesHaveProductId ?? false,
        linesHaveNumberAndPriceEach: options.linesHaveNumberAndPrice ?? false,
      },
      client
    )
    .catch((e) => apiError(cmd, 'Failed to create invoice.', e))

  console.log('Invoice created successfully.')
  console.log(`ID: ${result.xid}`)
}
