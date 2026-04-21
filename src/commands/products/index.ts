import { createArea } from '../../lib/area.js'
import { setup as listSetup, list } from './list.js'
import { setup as productTypesSetup, productTypes } from './product-types.js'

export const productsArea = createArea({
  name: 'products',
  description: 'Products and product types',
  info: 'The products area provides commands for listing products and product types in Multiregnskab.',
  subcommands: [
    {
      name: 'list',
      description: 'List products',
      info: 'Lists all products for the given company. Shows product ID, name, unit of measure, and price.',
      setup: listSetup,
      action: list,
    },
    {
      name: 'product-types',
      description: 'List available product types',
      info: 'Lists all product types for the given company. The product type ID is required for each invoice line and controls finance booking and VAT.',
      setup: productTypesSetup,
      action: productTypes,
    },
  ],
})
