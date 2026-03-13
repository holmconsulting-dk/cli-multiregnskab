import { createArea } from '../../lib/area.js'
import { setup as createSetup, create } from './create.js'
import { setup as productTypesSetup, productTypes } from './product-types.js'
import { setup as unitsOfMeasureSetup, unitsOfMeasure } from './units-of-measure.js'

export const invoicesArea = createArea({
  name: 'invoices',
  description: 'Manage invoices',
  info: 'The invoices area provides commands for creating invoices, offers, and credit notes in Multiregnskab.',
  subcommands: [
    {
      name: 'create',
      description: 'Create a new invoice, offer, or credit note',
      info: `Creates a new invoice (or offer/credit note) for the given company in draft mode.
Lines are provided as a JSON file via --lines.

Required fields per line:
  lineText          Description of the line item
  amount            Amount before VAT (e.g. "5000" or "1.200,50")
  productTypeXid    ID of the product type (run mr invoices product-types --company <xid> to find)

Optional fields per line:
  lineNote          Additional description
  numberOfUnits     Quantity (e.g. "10" or "2,5")
  unitOfMeasureCode Unit code (e.g. "EA" - run mr invoices units-of-measure to find)
  priceEach         Price per unit

Example lines.json:
[
  {
    "lineText": "Consulting",
    "amount": "5000",
    "productTypeXid": 987654
  },
  {
    "lineText": "Travel expenses",
    "lineNote": "Train Copenhagen-Aarhus",
    "numberOfUnits": "2",
    "unitOfMeasureCode": "EA",
    "priceEach": "125",
    "amount": "250",
    "productTypeXid": 987655
  }
]`,
      setup: createSetup,
      action: create,
    },
    {
      name: 'product-types',
      description: 'List available product types',
      info: 'Lists all product types for the given company. The product type ID is required for each invoice line and controls finance booking and VAT.',
      setup: productTypesSetup,
      action: productTypes,
    },
    {
      name: 'units-of-measure',
      description: 'List available units of measure',
      info: 'Lists all units of measure available for invoice lines, e.g. EA (each), hours, litres. Use --lang to get names in Danish (DA) or English (EN).',
      setup: unitsOfMeasureSetup,
      action: unitsOfMeasure,
    },
  ],
})
