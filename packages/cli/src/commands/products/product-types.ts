import { Command } from 'commander'
import { createClient } from '@holmconsulting/multiregnskab-api'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { apiError } from '../../lib/error.js'

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
}

export async function productTypes(options: { company?: string }, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)
  const client = createClient()

  const { data, error } = await client.GET('/productTypes/{companyXid}', {
    params: { path: { companyXid } },
  })

  if (error || !data) {
    apiError(cmd, 'Failed to retrieve product types.', error)
  }

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
