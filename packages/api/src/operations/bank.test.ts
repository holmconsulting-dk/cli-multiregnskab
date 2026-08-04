import { test, expect } from 'bun:test'
import { listBankAccountsOp, getBankBalancesOp, getBankPostingsOp } from './bank.js'
import type { ApiClient } from './types.js'

function mockGetClient(data: unknown): ApiClient {
  return { GET: async () => ({ data, error: undefined }) } as unknown as ApiClient
}

function errorGetClient(error: unknown): ApiClient {
  return { GET: async () => ({ data: undefined, error }) } as unknown as ApiClient
}

// ---------------------------------------------------------------------------
// listBankAccountsOp
// ---------------------------------------------------------------------------

const accountsResponse = {
  accounts: [
    { xid: 1, name: 'Main Account', currency: 'DKK', banksIdentification: 'DK1234' },
  ],
}

test('listBankAccountsOp returns accounts on success', async () => {
  const result = await listBankAccountsOp.execute({ companyXid: 1 }, mockGetClient(accountsResponse))
  expect(result).toEqual(accountsResponse)
})

test('listBankAccountsOp throws on API error', async () => {
  await expect(listBankAccountsOp.execute({ companyXid: 1 }, errorGetClient({ code: 403 }))).rejects.toThrow()
})

// ---------------------------------------------------------------------------
// getBankBalancesOp
// ---------------------------------------------------------------------------

const balancesResponse = {
  bbList: [
    { bankAccountName: 'Main', balanceType: 'CURRENT', balanceAmount: '10000.00', currency: 'DKK', timestamp: '2026-01-01' },
  ],
}

test('getBankBalancesOp returns balances on success', async () => {
  const result = await getBankBalancesOp.execute({ companyXid: 1 }, mockGetClient(balancesResponse))
  expect(result).toEqual(balancesResponse)
})

test('getBankBalancesOp throws on API error', async () => {
  await expect(getBankBalancesOp.execute({ companyXid: 1 }, errorGetClient({ code: 500 }))).rejects.toThrow()
})

// ---------------------------------------------------------------------------
// getBankPostingsOp
// ---------------------------------------------------------------------------

const postingsResponse = {
  bpList: [
    { bankDate: '2026-01-15', bankText: 'Invoice 123', bankAmount: '-5000.00', extraBankText: '' },
  ],
}

test('getBankPostingsOp returns postings on success', async () => {
  const result = await getBankPostingsOp.execute({ companyXid: 1, bankAccountXid: 5 }, mockGetClient(postingsResponse))
  expect(result).toEqual(postingsResponse)
})

test('getBankPostingsOp passes date filters when provided', async () => {
  let capturedParams: unknown
  const client: ApiClient = {
    GET: async (_url: unknown, opts: unknown) => {
      capturedParams = opts
      return { data: postingsResponse, error: undefined }
    },
  } as unknown as ApiClient

  await getBankPostingsOp.execute({ companyXid: 1, bankAccountXid: 5, fromDate: '2026-01-01', toDate: '2026-01-31' }, client)

  const query = (capturedParams as { params: { query: Record<string, string> } }).params.query
  expect(query.fromDateIncl).toBe('2026-01-01')
  expect(query.toDateIncl).toBe('2026-01-31')
})

test('getBankPostingsOp throws on API error', async () => {
  await expect(getBankPostingsOp.execute({ companyXid: 1, bankAccountXid: 5 }, errorGetClient({ code: 404 }))).rejects.toThrow()
})
