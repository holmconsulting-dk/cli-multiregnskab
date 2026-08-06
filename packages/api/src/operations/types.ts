import type { createUnauthenticatedClient } from '../client.js'
import type { z } from 'zod'

export type ApiClient = ReturnType<typeof createUnauthenticatedClient>

export class ApiOperationError extends Error {
  body: unknown
  response?: Response

  constructor(message: string, body: unknown, response?: Response) {
    super(message)
    this.name = 'ApiOperationError'
    this.body = body
    this.response = response
  }
}

export interface RegistrableOperation {
  name: string
  description: string
  info?: string
  inputSchema: Record<string, z.ZodTypeAny>
  execute: (input: Record<string, unknown>) => Promise<unknown>
}
