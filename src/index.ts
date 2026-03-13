#!/usr/bin/env node
import { Command } from 'commander'
import { userArea } from './commands/user/index.js'
import { companiesArea } from './commands/companies/index.js'
import { invoicesArea } from './commands/invoices/index.js'
import { customersArea } from './commands/customers/index.js'

const program = new Command()

program
  .name('mr')
  .description('Multiregnskab CLI')
  .version('0.1.0')

program.addCommand(userArea)
program.addCommand(companiesArea)
program.addCommand(invoicesArea)
program.addCommand(customersArea)

program.parse()
