import { Command } from 'commander'
import { createClient } from '../../api/client.js'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
}

export async function list(options: { company?: string }, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)
  const client = createClient()

  const { data, error } = await client.GET('/products/{companyXid}', {
    params: { path: { companyXid } },
  })

  if (error || !data) {
    console.error('Failed to retrieve products.')
    process.exit(1)
  }

  const products = data.products
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
