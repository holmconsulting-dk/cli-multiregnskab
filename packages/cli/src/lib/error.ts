import type { Command } from 'commander'
import { AuthenticationError, ApiOperationError } from '@holmconsulting-dk/multiregnskab-api'

export function fail(cmd: Command, message: string): never {
  console.error(cmd.helpInformation())
  console.error(`Error: ${message}`)
  process.exit(1)
}

export function apiError(cmd: Command, message: string, error: unknown, response?: Response): never {
  if (error instanceof AuthenticationError) {
    console.error(`${error.message} Run: mr user login`)
    process.exit(1)
  }

  const errResponse = response ?? (error instanceof ApiOperationError ? error.response : undefined)
  const errBody = error instanceof ApiOperationError ? error.body : error

  console.error(message)

  if (errResponse) {
    const statusText = errResponse.statusText ? ` ${errResponse.statusText}` : ''
    console.error(`HTTP ${errResponse.status}${statusText}`)
  }

  const verbose = (cmd.optsWithGlobals() as { verbose?: boolean }).verbose === true

  if (errBody !== undefined && errBody !== null) {
    const asString =
      typeof errBody === 'string' ? errBody : errBody instanceof Error ? errBody.message : JSON.stringify(errBody, null, 2)
    console.error(asString)
  } else if (errResponse && !errResponse.ok) {
    console.error('(Server returned an error status with no parseable body.)')
  }

  if (!verbose && errResponse) {
    console.error('Run again with --verbose for more request/response context.')
  }

  if (verbose && errResponse) {
    console.error('--- Request URL ---')
    console.error(errResponse.url)
  }

  process.exit(1)
}
