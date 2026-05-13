import { Command } from 'commander'
import { createClient } from '@holmconsulting/multiregnskab-api'
import { apiError } from '../../lib/error.js'

export async function list(_options: unknown, cmd: Command) {
  const client = createClient()
  const { data, error } = await client.GET('/companies')

  if (error || !data) {
    apiError(cmd, 'Failed to retrieve companies.', error)
  }

  const companies = data.companiesAndAccessList
  if (companies.length === 0) {
    console.log('No companies found.')
    return
  }

  const colId = Math.max('ID'.length, ...companies.map((c) => String(c.xid).length))
  const colCvr = Math.max('CVR'.length, ...companies.map((c) => c.cvr.length))
  const colName = Math.max('Name'.length, ...companies.map((c) => c.name.length))

  const header = `${'ID'.padEnd(colId)}  ${'CVR'.padEnd(colCvr)}  ${'Name'.padEnd(colName)}`
  const divider = `${'-'.repeat(colId)}  ${'-'.repeat(colCvr)}  ${'-'.repeat(colName)}`

  console.log(header)
  console.log(divider)
  for (const c of companies) {
    console.log(`${String(c.xid).padEnd(colId)}  ${c.cvr.padEnd(colCvr)}  ${c.name}`)
  }
}
