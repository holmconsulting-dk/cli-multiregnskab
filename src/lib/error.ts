import type { Command } from 'commander'

export function fail(cmd: Command, message: string): never {
  console.error(cmd.helpInformation())
  console.error(`Error: ${message}`)
  process.exit(1)
}

export function apiError(cmd: Command, message: string, error: unknown): never {
  console.error(message)
  if ((cmd.optsWithGlobals() as { verbose?: boolean }).verbose) {
    console.error(JSON.stringify(error, null, 2))
  }
  process.exit(1)
}
