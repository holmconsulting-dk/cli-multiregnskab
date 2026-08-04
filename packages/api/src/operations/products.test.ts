import { test, expect } from 'bun:test'
import { listProductsOp, listProductTypesOp, listUnitsOfMeasureOp } from './products.js'
import type { ApiClient } from './types.js'

function mockGetClient(data: unknown): ApiClient {
  return { GET: async () => ({ data, error: undefined }) } as unknown as ApiClient
}

function errorGetClient(error: unknown): ApiClient {
  return { GET: async () => ({ data: undefined, error }) } as unknown as ApiClient
}

// ---------------------------------------------------------------------------
// listProductsOp
// ---------------------------------------------------------------------------

const productsResponse = {
  productList: [
    { productXid: 1, productId: 'P001', productName: 'Widget', unitOfMeasureCode: 'STK', prices: [{ price: '99.00' }] },
  ],
}

test('listProductsOp returns products on success', async () => {
  const result = await listProductsOp.execute({ companyXid: 1 }, mockGetClient(productsResponse))
  expect(result).toEqual(productsResponse)
})

test('listProductsOp throws on API error', async () => {
  await expect(listProductsOp.execute({ companyXid: 1 }, errorGetClient({ code: 403 }))).rejects.toThrow()
})

// ---------------------------------------------------------------------------
// listProductTypesOp
// ---------------------------------------------------------------------------

const productTypesResponse = {
  ptList: [
    { productTypeXid: 10, typeName: 'Service' },
    { productTypeXid: 11, typeName: 'Goods' },
  ],
}

test('listProductTypesOp returns product types on success', async () => {
  const result = await listProductTypesOp.execute({ companyXid: 1 }, mockGetClient(productTypesResponse))
  expect(result).toEqual(productTypesResponse)
})

test('listProductTypesOp throws on API error', async () => {
  await expect(listProductTypesOp.execute({ companyXid: 1 }, errorGetClient({ code: 500 }))).rejects.toThrow()
})

// ---------------------------------------------------------------------------
// listUnitsOfMeasureOp
// ---------------------------------------------------------------------------

const unitsResponse = {
  uomList: [
    { uomCode: 'STK', singularis: 'styk', pluralis: 'styk' },
    { uomCode: 'TIM', singularis: 'time', pluralis: 'timer' },
  ],
}

test('listUnitsOfMeasureOp returns units for DA', async () => {
  const result = await listUnitsOfMeasureOp.execute({ language: 'DA' }, mockGetClient(unitsResponse))
  expect(result).toEqual(unitsResponse)
})

test('listUnitsOfMeasureOp returns units for EN', async () => {
  const result = await listUnitsOfMeasureOp.execute({ language: 'EN' }, mockGetClient(unitsResponse))
  expect(result).toEqual(unitsResponse)
})

test('listUnitsOfMeasureOp throws on API error', async () => {
  await expect(listUnitsOfMeasureOp.execute({ language: 'DA' }, errorGetClient({ code: 400 }))).rejects.toThrow()
})
