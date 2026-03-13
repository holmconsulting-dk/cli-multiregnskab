import { createArea } from '../../lib/area.js'
import { setup as listSetup, list } from './list.js'
import { setup as createSetup, create } from './create.js'

export const customersArea = createArea({
  name: 'customers',
  description: 'Manage customers',
  info: 'The customers area provides commands for listing and managing customers in Multiregnskab.',
  subcommands: [
    {
      name: 'list',
      description: 'List customers',
      info: 'Lists all customers for the given company. Optionally filter by customer name or number.',
      setup: listSetup,
      action: list,
    },
    {
      name: 'create',
      description: 'Create a new customer',
      info: 'Creates a new customer for the given company. Required fields are name, currency, address, zip, city, and country. Electronic invoicing fields are required together if enabled.',
      setup: createSetup,
      action: create,
    },
  ],
})
