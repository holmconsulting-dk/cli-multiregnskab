import { createArea } from '../../lib/area.js'
import { setup as createSetup, create } from './create.js'
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
  amount            Amount before VAT — ALWAYS required, even when priceEach and numberOfUnits are provided
  productTypeXid    ID of the product type (run mr products product-types --company <xid> to find)

Optional fields per line:
  lineNote          Additional description
  numberOfUnits     Quantity (e.g. 1, 2, 2.5)
  unitOfMeasureCode Unit code (e.g. "DAY", "EA" - run mr invoices units-of-measure to find)
  priceEach         Price per unit — also set amount to the same total value
  productXid        Product ID — only use if the product has a productTypeXid assigned in the system;
                    if unsure, use productTypeXid directly instead

Notes:
  - Use --lines-have-number-and-price to show quantity and unit price columns on the printed invoice
  - Use --title to set the invoice title (recommended)
  - productTypeXid is a number, not a string

Example lines.json:
[
  {
    "lineText": "Consulting",
    "amount": "5000",
    "productTypeXid": 987654
  },
  {
    "lineText": "Equipment rental",
    "numberOfUnits": 1,
    "unitOfMeasureCode": "DAY",
    "priceEach": "4000",
    "amount": "4000",
    "productTypeXid": 987655
  }
]`,
      setup: createSetup,
      action: create,
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
