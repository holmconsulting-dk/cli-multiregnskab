import { z } from 'zod'
import type { ApiClient } from './types.js'

const VALID_LANGUAGES = ['DA', 'EN'] as const
const VALID_PAYMENT_TERMS = ['RUNNING_MONTH', 'NET', 'NET_CASH', 'ALREADY_PAID'] as const
const VALID_EINVOICE_TYPES = ['DK_GLN', 'DK_CVR', 'DK_PNUMMER', 'DK_SENUMMER', 'PEPPOL'] as const

export type CreateCustomerInput = {
  companyXid: number
  customerName: string
  currencyCode: string
  address1: string
  zipCode: string
  city: string
  countryCode: string
  languageCode: (typeof VALID_LANGUAGES)[number]
  customerNumber?: string
  privatePerson?: boolean
  companyIdentifier?: string
  address2?: string
  address3?: string
  phone?: string
  invoiceAtt?: string
  invoiceEmail?: string
  paymentTermsType?: (typeof VALID_PAYMENT_TERMS)[number]
  paymentTermsDays?: number
  electronicInvoice?: boolean
  electronicInvoiceDestinationType?: (typeof VALID_EINVOICE_TYPES)[number]
  electronicInvoiceAddress?: string
}

export const listCustomersOp = {
  name: 'list_customers',
  description: 'List customers for a company, optionally filtered by name or customer number',
  inputSchema: {
    companyXid: z.number().describe('Company ID'),
    search: z.string().optional().describe('Filter by customer name or number'),
  },
  execute: async (input: { companyXid: number; search?: string }, client: ApiClient) => {
    const { data, error } = await client.GET('/customers/{companyXid}', {
      params: { path: { companyXid: input.companyXid } },
    })
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    let customers = data.customers ?? []
    if (input.search) {
      const term = input.search.toLowerCase()
      customers = customers.filter(
        (c) => c.customerName.toLowerCase().includes(term) || (c.customerNumber ?? '').toLowerCase().includes(term)
      )
    }
    return { customers }
  },
}

export const createCustomerOp = {
  name: 'create_customer',
  description: 'Create a new customer for a company',
  inputSchema: {
    companyXid: z.number().describe('Company ID'),
    customerName: z.string().describe('Customer name'),
    currencyCode: z.string().describe('Currency code, e.g. DKK'),
    address1: z.string().describe('Address line 1'),
    zipCode: z.string().describe('Zip/postal code'),
    city: z.string().describe('City'),
    countryCode: z.string().describe('Country code, e.g. DK'),
    languageCode: z.enum(VALID_LANGUAGES).describe('Language code for invoices (DA | EN)'),
    customerNumber: z.string().optional().describe('Customer number'),
    privatePerson: z.boolean().optional().describe('Mark as private person'),
    companyIdentifier: z.string().optional().describe('Company identifier, e.g. CVR number'),
    address2: z.string().optional().describe('Address line 2'),
    address3: z.string().optional().describe('Address line 3'),
    phone: z.string().optional().describe('Phone number'),
    invoiceAtt: z.string().optional().describe('Attention person for invoicing'),
    invoiceEmail: z.string().optional().describe('Default invoice recipient email'),
    paymentTermsType: z.enum(VALID_PAYMENT_TERMS).optional().describe('Payment terms type'),
    paymentTermsDays: z.number().optional().describe('Payment terms days'),
    electronicInvoice: z.boolean().optional().describe('Enable electronic invoicing'),
    electronicInvoiceDestinationType: z.enum(VALID_EINVOICE_TYPES).optional().describe('Electronic invoice destination type'),
    electronicInvoiceAddress: z.string().optional().describe('Electronic invoice destination address'),
  },
  execute: async (input: CreateCustomerInput, client: ApiClient) => {
    if (input.electronicInvoice) {
      if (!input.electronicInvoiceDestinationType) throw new Error('electronicInvoiceDestinationType is required when electronicInvoice is true')
      if (!input.electronicInvoiceAddress) throw new Error('electronicInvoiceAddress is required when electronicInvoice is true')
    }
    const { data, error } = await client.POST('/customers', {
      body: {
        companyXid: input.companyXid,
        xid: 0,
        entityVersion: 0,
        customerName: input.customerName,
        currencyCode: input.currencyCode,
        address1: input.address1,
        zipCode: input.zipCode,
        city: input.city,
        countryCode: input.countryCode,
        languageCode: input.languageCode,
        ...(input.customerNumber && { customerNumber: input.customerNumber }),
        ...(input.privatePerson !== undefined && { privatePerson: input.privatePerson }),
        ...(input.companyIdentifier && { companyIdentifier: input.companyIdentifier }),
        ...(input.address2 && { address2: input.address2 }),
        ...(input.address3 && { address3: input.address3 }),
        ...(input.phone && { phone: input.phone }),
        ...(input.invoiceAtt && { invoiceAtt: input.invoiceAtt }),
        ...(input.invoiceEmail && { invoiceEmail: input.invoiceEmail }),
        ...(input.paymentTermsType && { paymentTermsType: input.paymentTermsType }),
        ...(input.paymentTermsDays !== undefined && { paymentTermsDays: input.paymentTermsDays }),
        ...(input.electronicInvoice !== undefined && { electronicInvoice: input.electronicInvoice }),
        ...(input.electronicInvoiceDestinationType && { electronicInvoiceDestinationType: input.electronicInvoiceDestinationType }),
        ...(input.electronicInvoiceAddress && { electronicInvoiceAddress: input.electronicInvoiceAddress }),
      },
    })
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    return { xid: data.xid }
  },
}
