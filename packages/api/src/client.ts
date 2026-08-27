/// <reference types="node" />
import createFetchClient, { type Middleware } from 'openapi-fetch'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import type { paths } from './types.js'

export const DEFAULT_BASE_URL = 'https://www.multiregnskab.dk/open/clientapi/v1'
const AUTH_FILE = join(homedir(), '.config', 'mr', 'auth.json')

export interface StoredAuth {
  token: string
  tokenExpires: string
  refreshToken: string
}

export interface AuthConfig {
  getAuth: () => StoredAuth | null | Promise<StoredAuth | null>
  onAuthUpdated: (auth: StoredAuth) => void | Promise<void>
  baseUrl?: string
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export function readAuth(): StoredAuth | null {
  if (!existsSync(AUTH_FILE)) return null
  try {
    return JSON.parse(readFileSync(AUTH_FILE, 'utf-8')) as StoredAuth
  } catch {
    return null
  }
}

export function writeAuth(auth: StoredAuth): void {
  mkdirSync(join(homedir(), '.config', 'mr'), { recursive: true })
  writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2))
}

export function clearAuth(): void {
  if (existsSync(AUTH_FILE)) {
    writeFileSync(AUTH_FILE, '{}')
  }
}

function isTokenExpired(tokenExpires: string): boolean {
  return new Date(tokenExpires) <= new Date()
}

async function refreshToken(expiredAuth: StoredAuth, baseUrl: string): Promise<StoredAuth | null> {
  const response = await fetch(`${baseUrl}/refreshToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${expiredAuth.token}`,
    },
    body: JSON.stringify({ refreshToken: expiredAuth.refreshToken }),
  })
  if (!response.ok) return null
  const data = (await response.json()) as StoredAuth
  return {
    token: data.token,
    tokenExpires: data.tokenExpires,
    refreshToken: data.refreshToken,
  }
}

export async function loginWithPassword(
  username: string,
  password: string,
  options?: { baseUrl?: string },
): Promise<StoredAuth> {
  const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL
  const client = createFetchClient<paths>({ baseUrl })
  const { data, error, response } = await client.POST('/login', {
    body: { userName: username, password },
  })
  if (error || !data) {
    if (response && response.status === 401) {
      throw new Error('Login failed. Check your username and password.')
    }
    if (response) {
      throw new Error(`Login failed. HTTP ${response.status} ${response.statusText}`)
    }
    throw new Error('Login failed. Could not reach the server.')
  }
  return {
    token: data.token,
    tokenExpires: data.tokenExpires,
    refreshToken: data.refreshToken,
  }
}

export function createClient(config: AuthConfig) {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL
  const client = createFetchClient<paths>({ baseUrl })
  const pendingRequests = new WeakMap<Request, Request>()

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      const auth = await config.getAuth()
      if (!auth?.token) throw new AuthenticationError('Not authenticated.')

      if (!isTokenExpired(auth.tokenExpires)) {
        request.headers.set('Authorization', `Bearer ${auth.token}`)
        pendingRequests.set(request, request.clone())
        return request
      }

      const refreshed = await refreshToken(auth, baseUrl)
      if (!refreshed) throw new AuthenticationError('Session expired. Please log in again.')
      await config.onAuthUpdated(refreshed)
      request.headers.set('Authorization', `Bearer ${refreshed.token}`)
      pendingRequests.set(request, request.clone())
      return request
    },

    async onResponse({ request, response }) {
      if (response.status !== 401) {
        pendingRequests.delete(request)
        return response
      }

      const savedRequest = pendingRequests.get(request)
      pendingRequests.delete(request)

      const auth = await config.getAuth()
      if (!auth) throw new AuthenticationError('Session expired. Please log in again.')

      const refreshed = await refreshToken(auth, baseUrl)
      if (!refreshed) throw new AuthenticationError('Session expired. Please log in again.')
      await config.onAuthUpdated(refreshed)

      const retryRequest = savedRequest ?? new Request(request.url, { method: request.method })
      retryRequest.headers.set('Authorization', `Bearer ${refreshed.token}`)
      const retryResponse = await fetch(retryRequest)

      if (retryResponse.status === 401) {
        throw new AuthenticationError('Session expired. Please log in again.')
      }

      return retryResponse
    },
  }

  client.use(authMiddleware)
  return client
}

export function createUnauthenticatedClient(options?: { baseUrl?: string }) {
  return createFetchClient<paths>({ baseUrl: options?.baseUrl ?? DEFAULT_BASE_URL })
}
