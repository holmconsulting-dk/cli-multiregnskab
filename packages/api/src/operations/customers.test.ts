import { test, expect } from 'bun:test'
import { listCustomersOp, createCustomerOp } from './customers.js'
import type { ApiClient } from './types.js'

function mockGetClient(data: unknown): ApiClient {
  return { GET: async () => ({ data, error: undefined }) } as unknown as ApiClient
}

function mockPostClient(data: unknown): ApiClient {
  return { POST: async () => ({ data, error: undefined }) } as unknown as ApiClient
}

function errorClient(error: unknown): ApiClient {
  return {
    GET: async () => ({ data: undefined, error }),
    POST: async () => ({ data: undefined, error }),
  } as unknown as ApiClient
}

const customersResponse = {
  customers: [
    { xid: 10, customerName: 'Alpha Corp', customerNumber: 'C001', countryCode: 'DK', currencyCode: 'DKK' },
    { xid: 11, customerName: 'Beta Inc', customerNumber: 'C002', countryCode: 'US', currencyCode: 'USD' },
  ],
}

// ---------------------------------------------------------------------------
// listCustomersOp
// ---------------------------------------------------------------------------

test('listCustomersOp returns all customers', async () => {
  const result = await listCustomersOp.execute({ companyXid: 1 }, mockGetClient(customersResponse))
  expect(result.customers).toHaveLength(2)
})

test('listCustomersOp filters by search term on customerName', async () => {
  const result = await listCustomersOp.execute({ companyXid: 1, search: 'alpha' }, mockGetClient(customersResponse))
  expect(result.customers).toHaveLength(1)
  expect(result.customers[0].customerName).toBe('Alpha Corp')
})

test('listCustomersOp filters by search term on customerNumber', async () => {
  const result = await listCustomersOp.execute({ companyXid: 1, search: 'C002' }, mockGetClient(customersResponse))
  expect(result.customers).toHaveLength(1)
  expect(result.customers[0].customerNumber).toBe('C002')
})

test('listCustomersOp returns empty array when search has no match', async () => {
  const result = await listCustomersOp.execute({ companyXid: 1, search: 'zzz' }, mockGetClient(customersResponse))
  expect(result.customers).toHaveLength(0)
})

test('listCustomersOp throws on API error', async () => {
  await expect(listCustomersOp.execute({ companyXid: 1 }, errorClient({ code: 403 }))).rejects.toThrow()
})

// ---------------------------------------------------------------------------
// createCustomerOp
// ---------------------------------------------------------------------------

const baseCustomer = {
  companyXid: 1,
  customerName: 'New Customer',
  currencyCode: 'DKK',
  address1: 'Testvej 1',
  zipCode: '8000',
  city: 'Aarhus',
  countryCode: 'DK',
  languageCode: 'DA' as const,
}

test('createCustomerOp returns xid on success', async () => {
  const result = await createCustomerOp.execute(baseCustomer, mockPostClient({ xid: 42 }))
  expect(result).toEqual({ xid: 42 })
})

test('createCustomerOp throws on API error', async () => {
  await expect(createCustomerOp.execute(baseCustomer, errorClient({ code: 400 }))).rejects.toThrow()
})

test('createCustomerOp throws when electronicInvoice=true but type missing', async () => {
  await expect(
    createCustomerOp.execute({ ...baseCustomer, electronicInvoice: true, electronicInvoiceAddress: '12345678' }, mockPostClient({ xid: 1 }))
  ).rejects.toThrow('electronicInvoiceDestinationType')
})

test('createCustomerOp throws when electronicInvoice=true but address missing', async () => {
  await expect(
    createCustomerOp.execute({ ...baseCustomer, electronicInvoice: true, electronicInvoiceDestinationType: 'DK_CVR' as const }, mockPostClient({ xid: 1 }))
  ).rejects.toThrow('electronicInvoiceAddress')
})

test('createCustomerOp succeeds with valid einvoice fields', async () => {
  const result = await createCustomerOp.execute(
    { ...baseCustomer, electronicInvoice: true, electronicInvoiceDestinationType: 'DK_CVR' as const, electronicInvoiceAddress: '12345678' },
    mockPostClient({ xid: 99 })
  )
  expect(result).toEqual({ xid: 99 })
})
