import { getClient } from '../../lib/client.js'
import { Command } from 'commander'
import { listProductsOp } from '@holmconsulting/multiregnskab-api'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { apiError } from '../../lib/error.js'

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
}

export async function list(options: { company?: string }, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)
  const client = getClient()

  const data = await listProductsOp.execute({ companyXid }, client).catch((e) => apiError(cmd, 'Failed to retrieve products.', e))

  const products = data.productList
  if (products.length === 0) {
    console.log('No products found.')
    return
  }

  const col = (label: string, values: (string | null | undefined)[]) =>
    Math.max(label.length, ...values.map((v) => (v ?? '').length))

  const colXid = Math.max('ID'.length, ...products.map((p) => String(p.productXid).length))
  const colProductId = col('ProductId', products.map((p) => p.productId))
  const colName = col('Name', products.map((p) => p.productName))
  const colUnit = col('Unit', products.map((p) => p.unitOfMeasureCode))
  const colPrice = col('Price', products.map((p) => p.prices[0]?.price))

  const header = `${'ID'.padEnd(colXid)}  ${'ProductId'.padEnd(colProductId)}  ${'Name'.padEnd(colName)}  ${'Unit'.padEnd(colUnit)}  Price`
  const divider = `${'-'.repeat(colXid)}  ${'-'.repeat(colProductId)}  ${'-'.repeat(colName)}  ${'-'.repeat(colUnit)}  ${'-'.repeat(colPrice)}`

  console.log(header)
  console.log(divider)
  for (const p of products) {
    console.log(
      `${String(p.productXid).padEnd(colXid)}  ${(p.productId ?? '').padEnd(colProductId)}  ${p.productName.padEnd(colName)}  ${p.unitOfMeasureCode.padEnd(colUnit)}  ${p.prices[0]?.price ?? ''}`
    )
  }
}
