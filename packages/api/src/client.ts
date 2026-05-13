import createFetchClient, { type Middleware } from 'openapi-fetch'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import type { paths } from './types.js'

const BASE_URL = 'https://www.multiregnskab.dk/open/clientapi/v1'
const AUTH_FILE = join(homedir(), '.config', 'mr', 'auth.json')

interface StoredAuth {
  token: string
  tokenExpires: string
  refreshToken: string
}

function readAuth(): StoredAuth | null {
  if (!existsSync(AUTH_FILE)) return null
  try {
    return JSON.parse(readFileSync(AUTH_FILE, 'utf-8')) as StoredAuth
  } catch {
    return null
  }
}

function writeAuth(auth: StoredAuth): void {
  mkdirSync(join(homedir(), '.config', 'mr'), { recursive: true })
  writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2))
}

function clearAuth(): void {
  if (existsSync(AUTH_FILE)) {
    writeFileSync(AUTH_FILE, '{}')
  }
}

function isTokenExpired(tokenExpires: string): boolean {
  return new Date(tokenExpires) <= new Date()
}

async function refreshAuthToken(expiredAuth: StoredAuth): Promise<StoredAuth | null> {
  const response = await fetch(`${BASE_URL}/refreshToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${expiredAuth.token}`,
    },
    body: JSON.stringify({ refreshToken: expiredAuth.refreshToken }),
  })

  if (!response.ok) return null

  const data = (await response.json()) as StoredAuth
  const newAuth: StoredAuth = {
    token: data.token,
    tokenExpires: data.tokenExpires,
    refreshToken: data.refreshToken,
  }
  writeAuth(newAuth)
  return newAuth
}

async function getValidToken(): Promise<string> {
  const auth = readAuth()

  if (!auth?.token) {
    throw new Error('Not logged in. Run: mr user login')
  }

  if (!isTokenExpired(auth.tokenExpires)) {
    return auth.token
  }

  const refreshed = await refreshAuthToken(auth)
  if (!refreshed) {
    clearAuth()
    throw new Error('Session expired. Please log in again: mr user login')
  }

  return refreshed.token
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = await getValidToken()
    request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
}

export function createClient() {
  const client = createFetchClient<paths>({ baseUrl: BASE_URL })
  client.use(authMiddleware)
  return client
}

export function createUnauthenticatedClient() {
  return createFetchClient<paths>({ baseUrl: BASE_URL })
}

export { readAuth, writeAuth, clearAuth }
export type { StoredAuth }
