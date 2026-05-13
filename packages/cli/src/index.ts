#!/usr/bin/env node
import { Command } from 'commander'
import { userArea } from './commands/user/index.js'
import { companiesArea } from './commands/companies/index.js'
import { invoicesArea } from './commands/invoices/index.js'
import { customersArea } from './commands/customers/index.js'
import { bankArea } from './commands/bank/index.js'
import { productsArea } from './commands/products/index.js'

declare const __VERSION__: string
const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'dev'

const program = new Command()

program
  .name('mr')
  .description('Multiregnskab CLI')
  .version(version)
  .option('--verbose', 'print raw API error response on failure')

program.addCommand(userArea)
program.addCommand(companiesArea)
program.addCommand(invoicesArea)
program.addCommand(customersArea)
program.addCommand(bankArea)
program.addCommand(productsArea)

program.parse()
