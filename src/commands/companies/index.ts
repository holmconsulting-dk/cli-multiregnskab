import { createArea } from '../../lib/area.js'
import { list } from './list.js'

export const companiesArea = createArea({
  name: 'companies',
  description: 'Manage companies',
  info: 'The companies area provides access to the companies you have access to. Use the company ID shown here with other commands.',
  subcommands: [
    {
      name: 'list',
      description: 'List companies you have access to',
      info: 'Lists all companies the current user has access to, including their IDs and CVR numbers. Use the ID with --company on other commands.',
      action: list,
    },
  ],
})
