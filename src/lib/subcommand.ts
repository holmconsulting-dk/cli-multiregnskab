import { Command } from 'commander'

export interface SubCommandConfig {
  name: string
  description: string
  info: string
  setup?: (cmd: Command) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any[]) => void | Promise<void>
}

export function createSubCommand(config: SubCommandConfig): Command {
  const cmd = new Command(config.name).description(config.description)

  if (config.setup) {
    config.setup(cmd)
  }

  cmd.addCommand(
    new Command('info')
      .description(`Show info about the ${config.name} command`)
      .action(() => {
        console.log(config.info)

        const args = cmd.registeredArguments
        if (args.length > 0) {
          console.log()
          console.log('Arguments:')
          const maxLen = Math.max(...args.map((a) => a.name().length))
          for (const arg of args) {
            const name = arg.required ? `<${arg.name()}>` : `[${arg.name()}]`
            console.log(`  ${name.padEnd(maxLen + 4)}${arg.description}`)
          }
        }

        const opts = cmd.options
        if (opts.length > 0) {
          console.log()
          console.log('Options:')
          const maxLen = Math.max(...opts.map((o) => o.flags.length))
          for (const opt of opts) {
            const def = opt.defaultValue !== undefined ? `  (default: ${opt.defaultValue})` : ''
            console.log(`  ${opt.flags.padEnd(maxLen + 2)}${opt.description}${def}`)
          }
        }
      })
  )

  cmd.action(config.action)

  return cmd
}
