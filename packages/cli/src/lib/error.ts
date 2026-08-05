import type { Command } from 'commander'
import { AuthenticationError } from '@holmconsulting/multiregnskab-api'

export function fail(cmd: Command, message: string): never {
  console.error(cmd.helpInformation())
  console.error(`Error: ${message}`)
  process.exit(1)
}

export function apiError(cmd: Command, message: string, error: unknown): never {
  if (error instanceof AuthenticationError) {
    console.error(`${error.message} Run: mr user login`)
  } else {
    console.error(message)
    if ((cmd.optsWithGlobals() as { verbose?: boolean }).verbose) {
      console.error(JSON.stringify(error, null, 2))
    }
  }
  process.exit(1)
}
