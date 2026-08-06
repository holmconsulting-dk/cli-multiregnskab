import type { createUnauthenticatedClient } from '../client.js'
import type { z } from 'zod'

export type ApiClient = ReturnType<typeof createUnauthenticatedClient>

export interface RegistrableOperation {
  name: string
  description: string
  info?: string
  inputSchema: Record<string, z.ZodTypeAny>
  execute: (input: Record<string, unknown>) => Promise<unknown>
}
