import { createArea } from '../../lib/area.js'
import { setup as createSetup, create } from './create.js'
import { setup as unitsOfMeasureSetup, unitsOfMeasure } from './units-of-measure.js'
import { createInvoiceOp } from '@holmconsulting/multiregnskab-api'

export const invoicesArea = createArea({
  name: 'invoices',
  description: 'Manage invoices',
  info: 'The invoices area provides commands for creating invoices, offers, and credit notes in Multiregnskab.',
  subcommands: [
    {
      name: 'create',
      description: 'Create a new invoice, offer, or credit note',
      info: createInvoiceOp.info,
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
