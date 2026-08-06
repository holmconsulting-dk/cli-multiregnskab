import { test, expect } from 'bun:test'
import { createInvoiceOp } from './invoices.js'
import type { ApiClient } from './types.js'

function mockPostClient(data: unknown): ApiClient {
  return { POST: async () => ({ data, error: undefined }) } as unknown as ApiClient
}

function errorPostClient(error: unknown): ApiClient {
  return { POST: async () => ({ data: undefined, error }) } as unknown as ApiClient
}

const validLine = { lineText: 'Consulting', amount: '1000', productTypeXid: 10 }

const baseInput = {
  companyXid: 1,
  customerXid: 5,
  date: '2026-01-15',
  lines: [validLine],
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test('createInvoiceOp returns xid on success', async () => {
  const result = await createInvoiceOp.execute(baseInput, mockPostClient({ xid: 99 }))
  expect(result).toEqual({ xid: 99 })
})

test('createInvoiceOp passes optional fields to API', async () => {
  let capturedBody: unknown
  const client: ApiClient = {
    POST: async (_url: unknown, opts: unknown) => {
      capturedBody = (opts as { body: unknown }).body
      return { data: { xid: 1 }, error: undefined }
    },
  } as unknown as ApiClient

  await createInvoiceOp.execute({ ...baseInput, title: 'My Invoice', creditNote: true }, client)

  const body = capturedBody as Record<string, unknown>
  expect(body.title).toBe('My Invoice')
  expect(body.creditNote).toBe(true)
})

// ---------------------------------------------------------------------------
// Date validation
// ---------------------------------------------------------------------------

test('createInvoiceOp throws on invalid date format', async () => {
  await expect(createInvoiceOp.execute({ ...baseInput, date: '15-01-2026' }, mockPostClient({ xid: 1 }))).rejects.toThrow('YYYY-MM-DD')
})

test('createInvoiceOp throws on non-date string', async () => {
  await expect(createInvoiceOp.execute({ ...baseInput, date: 'tomorrow' }, mockPostClient({ xid: 1 }))).rejects.toThrow('YYYY-MM-DD')
})

// ---------------------------------------------------------------------------
// Line validation
// ---------------------------------------------------------------------------

test('createInvoiceOp throws on empty lines array', async () => {
  await expect(createInvoiceOp.execute({ ...baseInput, lines: [] }, mockPostClient({ xid: 1 }))).rejects.toThrow('non-empty')
})

test('createInvoiceOp throws when line is missing lineText', async () => {
  const lines = [{ amount: '100', productTypeXid: 10 }] as never
  await expect(createInvoiceOp.execute({ ...baseInput, lines }, mockPostClient({ xid: 1 }))).rejects.toThrow('lineText')
})

test('createInvoiceOp throws when line is missing amount', async () => {
  const lines = [{ lineText: 'Test', productTypeXid: 10 }] as never
  await expect(createInvoiceOp.execute({ ...baseInput, lines }, mockPostClient({ xid: 1 }))).rejects.toThrow('amount')
})

test('createInvoiceOp throws when line is missing productTypeXid', async () => {
  const lines = [{ lineText: 'Test', amount: '100' }] as never
  await expect(createInvoiceOp.execute({ ...baseInput, lines }, mockPostClient({ xid: 1 }))).rejects.toThrow('productTypeXid')
})

test('createInvoiceOp throws with helpful hint when productXid present but productTypeXid missing', async () => {
  const lines = [{ lineText: 'Test', amount: '100', productXid: 999 }] as never
  await expect(createInvoiceOp.execute({ ...baseInput, lines }, mockPostClient({ xid: 1 }))).rejects.toThrow('productXid does not replace productTypeXid')
})

// ---------------------------------------------------------------------------
// API error
// ---------------------------------------------------------------------------

test('createInvoiceOp throws on API error', async () => {
  await expect(createInvoiceOp.execute(baseInput, errorPostClient({ code: 422 }))).rejects.toThrow()
})
