import { getClient } from '../../lib/client.js'
import { Command } from 'commander'
import { listProductTypesOp } from '@holmconsulting/multiregnskab-api'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { apiError } from '../../lib/error.js'

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
}

export async function productTypes(options: { company?: string }, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)
  const client = getClient()

  const data = await listProductTypesOp.execute({ companyXid }, client).catch((e) => apiError(cmd, 'Failed to retrieve product types.', e))

  const types = data.ptList
  if (types.length === 0) {
    console.log('No product types found.')
    return
  }

  const colId = Math.max('ID'.length, ...types.map((t) => String(t.productTypeXid).length))
  const colName = Math.max('Name'.length, ...types.map((t) => t.typeName.length))

  console.log(`${'ID'.padEnd(colId)}  Name`)
  console.log(`${'-'.repeat(colId)}  ${'-'.repeat(colName)}`)
  for (const t of types) {
    console.log(`${String(t.productTypeXid).padEnd(colId)}  ${t.typeName}`)
  }
}
