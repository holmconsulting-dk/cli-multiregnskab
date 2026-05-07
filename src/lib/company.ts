import type { Command } from 'commander'
import { fail } from './error.js'

export function setupCompanyOption(cmd: Command) {
  cmd.option('--company <xid>', 'company ID (use mr companies list to find your ID)')
}

export function parseCompanyXid(options: { company?: string }, cmd: Command): number {
  if (!options.company) {
    fail(cmd, '--company <xid> is required. Run mr companies list to find your company ID.')
  }
  const xid = parseInt(options.company, 10)
  if (isNaN(xid)) {
    fail(cmd, `Invalid company ID: ${options.company}`)
  }
  return xid
}
