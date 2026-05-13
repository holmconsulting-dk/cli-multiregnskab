import { Command } from 'commander'
import { createClient } from '@holmconsulting/multiregnskab-api'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { fail, apiError } from '../../lib/error.js'

const VALID_LANGUAGES = ['DA', 'EN'] as const
const VALID_PAYMENT_TERMS = ['RUNNING_MONTH', 'NET', 'NET_CASH', 'ALREADY_PAID'] as const
const VALID_EINVOICE_TYPES = ['DK_GLN', 'DK_CVR', 'DK_PNUMMER', 'DK_SENUMMER', 'PEPPOL'] as const

type Language = (typeof VALID_LANGUAGES)[number]
type PaymentTermsType = (typeof VALID_PAYMENT_TERMS)[number]
type EinvoiceDestinationType = (typeof VALID_EINVOICE_TYPES)[number]

interface CreateOptions {
  company?: string
  name?: string
  currency?: string
  address1?: string
  zip?: string
  city?: string
  country?: string
  number?: string
  private?: boolean
  cvr?: string
  address2?: string
  address3?: string
  phone?: string
  att?: string
  email?: string
  lang?: string
  paymentTerms?: string
  paymentDays?: string
  einvoice?: boolean
  einvoiceType?: string
  einvoiceAddress?: string
}

export function setup(cmd: Command) {
  setupCompanyOption(cmd)

  // Required fields
  cmd
    .option('--name <name>', 'customer name (required)')
    .option('--currency <code>', 'currency code, e.g. DKK (required)')
    .option('--address1 <address>', 'address line 1 (required)')
    .option('--zip <code>', 'zip/postal code (required)')
    .option('--city <city>', 'city (required)')
    .option('--country <code>', 'country code, e.g. DK (required)')

  // Optional fields
  cmd
    .option('--number <number>', 'customer number')
    .option('--private', 'mark as private person (default: business customer)')
    .option('--cvr <identifier>', 'company identifier, e.g. CVR number')
    .option('--address2 <address>', 'address line 2')
    .option('--address3 <address>', 'address line 3')
    .option('--phone <phone>', 'phone number')
    .option('--att <name>', 'attention person for invoicing')
    .option('--email <email>', 'default invoice recipient email')
    .option('--lang <code>', `language code for invoices (${VALID_LANGUAGES.join(' | ')}) (required)`)
    .option('--payment-terms <type>', `payment terms type (${VALID_PAYMENT_TERMS.join(' | ')})`)
    .option('--payment-days <days>', 'payment terms days')
    .option('--einvoice', 'enable electronic invoicing')
    .option('--einvoice-type <type>', `electronic invoice destination type (${VALID_EINVOICE_TYPES.join(' | ')})`)
    .option('--einvoice-address <address>', 'electronic invoice destination address')
}

export async function create(options: CreateOptions, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)

  const required: Array<[keyof CreateOptions, string]> = [
    ['name', '--name'],
    ['currency', '--currency'],
    ['address1', '--address1'],
    ['zip', '--zip'],
    ['city', '--city'],
    ['country', '--country'],
    ['lang', '--lang'],
  ]
  const missing = required.filter(([key]) => !options[key]).map(([, flag]) => flag)
  if (missing.length > 0) {
    fail(cmd, `Missing required options: ${missing.join(', ')}`)
  }

  if (options.lang && !VALID_LANGUAGES.includes(options.lang as Language)) {
    fail(cmd, `Invalid --lang value: ${options.lang}. Must be one of: ${VALID_LANGUAGES.join(', ')}`)
  }

  if (options.paymentTerms && !VALID_PAYMENT_TERMS.includes(options.paymentTerms as PaymentTermsType)) {
    fail(cmd, `Invalid --payment-terms value: ${options.paymentTerms}. Must be one of: ${VALID_PAYMENT_TERMS.join(', ')}`)
  }

  if (options.einvoice) {
    if (!options.einvoiceType) {
      fail(cmd, '--einvoice-type is required when --einvoice is set')
    }
    if (!VALID_EINVOICE_TYPES.includes(options.einvoiceType as EinvoiceDestinationType)) {
      fail(cmd, `Invalid --einvoice-type value: ${options.einvoiceType}. Must be one of: ${VALID_EINVOICE_TYPES.join(', ')}`)
    }
    if (!options.einvoiceAddress) {
      fail(cmd, '--einvoice-address is required when --einvoice is set')
    }
  }

  const client = createClient()
  const { data, error } = await client.POST('/customers', {
    body: {
      companyXid,
      xid: 0,
      entityVersion: 0,
      customerName: options.name!,
      currencyCode: options.currency!,
      address1: options.address1!,
      zipCode: options.zip!,
      city: options.city!,
      countryCode: options.country!,
      ...(options.number && { customerNumber: options.number }),
      ...(options.private !== undefined && { privatePerson: options.private }),
      ...(options.cvr && { companyIdentifier: options.cvr }),
      ...(options.address2 && { address2: options.address2 }),
      ...(options.address3 && { address3: options.address3 }),
      ...(options.phone && { phone: options.phone }),
      ...(options.att && { invoiceAtt: options.att }),
      ...(options.email && { invoiceEmail: options.email }),
      ...(options.lang && { languageCode: options.lang as Language }),
      ...(options.paymentTerms && { paymentTermsType: options.paymentTerms as PaymentTermsType }),
      ...(options.paymentDays && { paymentTermsDays: parseInt(options.paymentDays, 10) }),
      ...(options.einvoice !== undefined && { electronicInvoice: options.einvoice }),
      ...(options.einvoiceType && { electronicInvoiceDestinationType: options.einvoiceType as EinvoiceDestinationType }),
      ...(options.einvoiceAddress && { electronicInvoiceAddress: options.einvoiceAddress }),
    },
  })

  if (error || !data) {
    apiError(cmd, 'Failed to create customer.', error)
  }

  console.log('Customer created successfully.')
  console.log(`ID: ${data.xid}`)
}
