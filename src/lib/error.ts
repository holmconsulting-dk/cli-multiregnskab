import type { Command } from 'commander'

export function fail(cmd: Command, message: string): never {
  console.error(cmd.helpInformation())
  console.error(`Error: ${message}`)
  process.exit(1)
}

export function apiError(cmd: Command, message: string, error: unknown, response?: Response): never {
  console.error(message)

  if (response) {
    const statusText = response.statusText ? ` ${response.statusText}` : ''
    console.error(`HTTP ${response.status}${statusText}`)
  }

  const verbose = (cmd.optsWithGlobals() as { verbose?: boolean }).verbose === true

  if (error !== undefined && error !== null) {
    const asString = typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    console.error(asString)
  } else if (response && !response.ok) {
    console.error('(Server returned an error status with no parseable body.)')
  }

  if (!verbose && response) {
    console.error('Run again with --verbose for more request/response context.')
  }

  if (verbose && response) {
    console.error('--- Request URL ---')
    console.error(response.url)
  }

  process.exit(1)
}
