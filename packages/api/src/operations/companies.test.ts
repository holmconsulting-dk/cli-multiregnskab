import { test, expect } from 'bun:test'
import { listCompaniesOp } from './companies.js'
import type { ApiClient } from './types.js'

function mockGetClient(data: unknown): ApiClient {
  return { GET: async () => ({ data, error: undefined }) } as unknown as ApiClient
}

function errorGetClient(error: unknown): ApiClient {
  return { GET: async () => ({ data: undefined, error }) } as unknown as ApiClient
}

const companies = {
  companiesAndAccessList: [
    { xid: 1, name: 'Acme A/S', cvr: '12345678' },
    { xid: 2, name: 'Beta ApS', cvr: '87654321' },
  ],
}

test('listCompaniesOp returns company list on success', async () => {
  const result = await listCompaniesOp.execute({}, mockGetClient(companies))
  expect(result).toEqual(companies)
})

test('listCompaniesOp throws on API error', async () => {
  await expect(listCompaniesOp.execute({}, errorGetClient({ code: 401 }))).rejects.toThrow()
})

test('listCompaniesOp throws on null data', async () => {
  await expect(listCompaniesOp.execute({}, mockGetClient(null))).rejects.toThrow()
})
