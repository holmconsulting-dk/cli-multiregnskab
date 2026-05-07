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
      info: `Creates a new customer for the given company.

Required options:
  --name            Customer name
  --currency        Currency code, e.g. DKK
  --address1        Address line 1
  --zip             Zip/postal code
  --city            City
  --country         Country code, e.g. DK
  --lang            Language for invoices: DA or EN
  --payment-terms   Payment terms type: RUNNING_MONTH | NET | NET_CASH | ALREADY_PAID
  --payment-days    Number of days for the payment term (e.g. 30) — separate from --payment-terms

Customer type:
  Default is business customer. Add --private for private persons.
  This affects how the customer appears on invoices.

Electronic invoicing (all three required together if used):
  --einvoice
  --einvoice-type   DK_GLN | DK_CVR | DK_PNUMMER | DK_SENUMMER | PEPPOL
  --einvoice-address

Example — private person:
  mr customers create --company <xid> --name "Hans Andersen" --currency DKK \\
    --address1 "Markvejen 20" --zip "8000" --city "Aarhus" --country DK \\
    --lang DA --payment-terms NET --private

Example — business customer:
  mr customers create --company <xid> --name "Acme ApS" --currency DKK \\
    --address1 "Industrivej 1" --zip "2100" --city "Copenhagen" --country DK \\
    --lang DA --payment-terms NET --cvr 12345678`,
      setup: createSetup,
      action: create,
    },
  ],
})
