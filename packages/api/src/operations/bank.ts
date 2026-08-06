import { z } from 'zod'
import type { ApiClient } from './types.js'

export const listBankAccountsOp = {
  name: 'list_bank_accounts',
  description: 'List bank accounts for a company',
  inputSchema: {
    companyXid: z.number().describe('Company ID'),
  },
  execute: async (input: { companyXid: number }, client: ApiClient) => {
    const { data, error } = await client.GET('/bankAccounts/{companyXid}', {
      params: { path: { companyXid: input.companyXid } },
    })
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    return data
  },
}

export const getBankBalancesOp = {
  name: 'get_bank_balances',
  description: 'Get bank balances for a company',
  inputSchema: {
    companyXid: z.number().describe('Company ID'),
  },
  execute: async (input: { companyXid: number }, client: ApiClient) => {
    const { data, error } = await client.GET('/bankBalances/{companyXid}', {
      params: { path: { companyXid: input.companyXid } },
    })
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    return data
  },
}

export const getBankPostingsOp = {
  name: 'get_bank_postings',
  description: 'Get bank postings for a specific bank account, optionally filtered by date range',
  inputSchema: {
    companyXid: z.number().describe('Company ID'),
    bankAccountXid: z.number().describe('Bank account ID'),
    fromDate: z.string().optional().describe('Include postings from this date, e.g. 2026-01-01'),
    toDate: z.string().optional().describe('Include postings up to and including this date'),
  },
  execute: async (
    input: { companyXid: number; bankAccountXid: number; fromDate?: string; toDate?: string },
    client: ApiClient
  ) => {
    const { data, error } = await client.GET('/bankPostings/{companyXid}/{bankAccountXid}', {
      params: {
        path: { companyXid: input.companyXid, bankAccountXid: input.bankAccountXid },
        query: {
          ...(input.fromDate && { fromDateIncl: input.fromDate }),
          ...(input.toDate && { toDateIncl: input.toDate }),
        },
      },
    })
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    return data
  },
}
