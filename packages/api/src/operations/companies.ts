import type { ApiClient } from './types.js'

export const listCompaniesOp = {
  name: 'list_companies',
  description: 'List all companies the user has access to',
  inputSchema: {} as Record<string, never>,
  execute: async (_input: Record<string, never>, client: ApiClient) => {
    const { data, error } = await client.GET('/companies')
    if (error || !data) throw new Error(JSON.stringify(error ?? 'Unknown error'))
    return data
  },
}
