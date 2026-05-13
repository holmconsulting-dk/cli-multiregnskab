import { Command } from 'commander'
import { type SubCommandConfig, createSubCommand } from './subcommand.js'

export interface AreaConfig {
  name: string
  description: string
  info: string
  subcommands: SubCommandConfig[]
}

export function createArea(config: AreaConfig): Command {
  const area = new Command(config.name).description(config.description)

  area.addCommand(
    new Command('info')
      .description(`Show info about the ${config.name} area`)
      .action(() => {
        console.log(config.info)
        console.log()
        console.log('Available commands:')
        const maxLen = Math.max(...config.subcommands.map((s) => s.name.length))
        for (const sub of config.subcommands) {
          console.log(`  ${sub.name.padEnd(maxLen + 2)}${sub.description}`)
        }
        console.log()
        console.log(`Run 'mr ${config.name} <command> info' for details on a specific command.`)
        console.log()
        console.log('Global options:')
        console.log('  --verbose  Print raw API error response on failure')
      })
  )

  for (const sub of config.subcommands) {
    area.addCommand(createSubCommand(sub))
  }

  return area
}
