import { ApiOperationError } from './types.js'
import type { ApiClient } from './types.js'

export const listCompaniesOp = {
  name: 'list_companies',
  description: 'List all companies the user has access to',
  inputSchema: {} as Record<string, never>,
  execute: async (_input: Record<string, never>, client: ApiClient) => {
    const { data, error, response } = await client.GET('/companies')
    if (error || !data) throw new ApiOperationError(JSON.stringify(error ?? 'Unknown error'), error, response)
    return data
  },
}
