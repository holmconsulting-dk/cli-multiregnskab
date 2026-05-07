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
      info: 'Lists all products for the given company. Shows productXid, productId, name, unit of measure, and price. Use this when building invoice lines — it gives you unit and price in addition to the product type ID.',
      setup: listSetup,
      action: list,
    },
    {
      name: 'product-types',
      description: 'List available product types',
      info: 'Lists product type IDs and names only. The productTypeXid is required for each invoice line and controls finance booking and VAT. Use mr products list if you also need unit of measure or price.',
      setup: productTypesSetup,
      action: productTypes,
    },
  ],
})
