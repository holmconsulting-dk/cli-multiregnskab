import { z } from 'zod'
import type { ApiClient } from './types.js'

export const listProductsOp = {
  name: 'list_products',
  description: 'List products for a company',
  inputSchema: {
    companyXid: z.number().describe('Company ID'),
  },
  execute: async (input: { companyXid: number }, client: ApiClient) => {
    const { data, error } = await client.GET('/products/{companyXid}', {
      params: { path: { companyXid: input.companyXid } },
    })
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    return data
  },
}

export const listProductTypesOp = {
  name: 'list_product_types',
  description: 'List product types for a company — provides the productTypeXid required on invoice lines',
  inputSchema: {
    companyXid: z.number().describe('Company ID'),
  },
  execute: async (input: { companyXid: number }, client: ApiClient) => {
    const { data, error } = await client.GET('/productTypes/{companyXid}', {
      params: { path: { companyXid: input.companyXid } },
    })
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    return data
  },
}

export const listUnitsOfMeasureOp = {
  name: 'list_units_of_measure',
  description: 'List units of measure for a given language (DA or EN)',
  inputSchema: {
    language: z.enum(['DA', 'EN']).describe('Language for unit names'),
  },
  execute: async (input: { language: 'DA' | 'EN' }, client: ApiClient) => {
    const { data, error } = await client.GET('/unitsOfMeasure/{language}', {
      params: { path: { language: input.language } },
    })
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    return data
  },
}
