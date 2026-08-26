import { test, expect, afterEach } from 'bun:test'
import { createClient, createUnauthenticatedClient, loginWithPassword, AuthenticationError, DEFAULT_BASE_URL } from './client.js'
import type { StoredAuth } from './client.js'

const FUTURE = '2099-01-01T00:00:00.000Z'

const validAuth: StoredAuth = {
  token: 'valid-token',
  tokenExpires: FUTURE,
  refreshToken: 'valid-refresh',
}

const refreshedAuth: StoredAuth = {
  token: 'refreshed-token',
  tokenExpires: FUTURE,
  refreshToken: 'new-refresh',
}

function makeResponse(status: number, body: unknown = null): Response {
  return new Response(body !== null ? JSON.stringify(body) : null, {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})

function mockFetch(...responses: Response[]) {
  let i = 0
  globalThis.fetch = async () => responses[i++] ?? makeResponse(500)
}

function mockFetchRecordingUrls(...responses: Response[]) {
  const urls: string[] = []
  let i = 0
  globalThis.fetch = async (input: RequestInfo | URL) => {
    urls.push(input instanceof Request ? input.url : String(input))
    return responses[i++] ?? makeResponse(500)
  }
  return urls
}

// ---------------------------------------------------------------------------
// configurable baseUrl
// ---------------------------------------------------------------------------

test('createClient sends requests and token refreshes to the configured baseUrl', async () => {
  const customBaseUrl = 'https://staging.example.com/api/v1'
  const urls = mockFetchRecordingUrls(
    makeResponse(401),                                            // initial /user call
    makeResponse(200, refreshedAuth),                            // /refreshToken
    makeResponse(200, { userName: 'test', realName: 'Test' }),   // retry /user
  )

  const client = createClient({
    getAuth: () => validAuth,
    onAuthUpdated: () => {},
    baseUrl: customBaseUrl,
  })

  await client.GET('/user')

  expect(urls.every((url) => url.startsWith(customBaseUrl))).toBe(true)
  expect(urls.some((url) => url.startsWith(DEFAULT_BASE_URL))).toBe(false)
})

test('createClient falls back to DEFAULT_BASE_URL when baseUrl is omitted', async () => {
  const urls = mockFetchRecordingUrls(makeResponse(200, { userName: 'test', realName: 'Test' }))

  const client = createClient({ getAuth: () => validAuth, onAuthUpdated: () => {} })
  await client.GET('/user')

  expect(urls[0]?.startsWith(DEFAULT_BASE_URL)).toBe(true)
})

test('createUnauthenticatedClient uses the configured baseUrl', async () => {
  const customBaseUrl = 'https://staging.example.com/api/v1'
  const urls = mockFetchRecordingUrls(makeResponse(200, []))

  const client = createUnauthenticatedClient({ baseUrl: customBaseUrl })
  await client.GET('/companies')

  expect(urls[0]?.startsWith(customBaseUrl)).toBe(true)
})

test('loginWithPassword uses the configured baseUrl', async () => {
  const customBaseUrl = 'https://staging.example.com/api/v1'
  const urls = mockFetchRecordingUrls(makeResponse(200, validAuth))

  await loginWithPassword('user', 'pass', { baseUrl: customBaseUrl })

  expect(urls[0]?.startsWith(customBaseUrl)).toBe(true)
})

// ---------------------------------------------------------------------------
// onResponse 401 handling (backend-side revocation)
// ---------------------------------------------------------------------------

test('onResponse 401 triggers refresh, retries, and returns success', async () => {
  const updatedAuths: StoredAuth[] = []
  mockFetch(
    makeResponse(401),                                            // initial /user call
    makeResponse(200, refreshedAuth),                            // /refreshToken
    makeResponse(200, { userName: 'test', realName: 'Test' }),   // retry /user
  )

  const client = createClient({
    getAuth: () => validAuth,
    onAuthUpdated: (auth) => { updatedAuths.push(auth) },
  })

  const { data, error } = await client.GET('/user')

  expect(error).toBeUndefined()
  expect(data?.userName).toBe('test')
  expect(updatedAuths).toHaveLength(1)
  expect(updatedAuths[0]?.token).toBe('refreshed-token')
})

test('onResponse 401 with failed refresh throws AuthenticationError', async () => {
  mockFetch(
    makeResponse(401),   // initial call
    makeResponse(401),   // /refreshToken fails
  )

  const client = createClient({ getAuth: () => validAuth, onAuthUpdated: () => {} })

  await expect(client.GET('/user')).rejects.toThrow(AuthenticationError)
})

test('onResponse 401 with refresh success but retry still 401 throws AuthenticationError', async () => {
  mockFetch(
    makeResponse(401),                  // initial call
    makeResponse(200, refreshedAuth),   // /refreshToken succeeds
    makeResponse(401),                  // retry still rejected
  )

  const client = createClient({ getAuth: () => validAuth, onAuthUpdated: () => {} })

  await expect(client.GET('/user')).rejects.toThrow(AuthenticationError)
})

test('non-401 response passes through without triggering refresh', async () => {
  let authUpdated = false
  mockFetch(
    makeResponse(200, { userName: 'test', realName: 'Test' }),
  )

  const client = createClient({
    getAuth: () => validAuth,
    onAuthUpdated: () => { authUpdated = true },
  })

  const { data } = await client.GET('/user')

  expect(data?.userName).toBe('test')
  expect(authUpdated).toBe(false)
})

// ---------------------------------------------------------------------------
// onRequest proactive expiry (existing behaviour, confirmed not broken)
// ---------------------------------------------------------------------------

test('onRequest refreshes proactively when token is clock-expired', async () => {
  const expiredAuth: StoredAuth = { ...validAuth, tokenExpires: '2020-01-01T00:00:00.000Z' }
  const updatedAuths: StoredAuth[] = []

  mockFetch(
    makeResponse(200, refreshedAuth),                            // /refreshToken
    makeResponse(200, { userName: 'test', realName: 'Test' }),   // the actual request
  )

  const client = createClient({
    getAuth: () => expiredAuth,
    onAuthUpdated: (auth) => { updatedAuths.push(auth) },
  })

  const { data } = await client.GET('/user')

  expect(data?.userName).toBe('test')
  expect(updatedAuths[0]?.token).toBe('refreshed-token')
})

test('onRequest throws AuthenticationError when no token is present', async () => {
  const client = createClient({ getAuth: () => null, onAuthUpdated: () => {} })

  await expect(client.GET('/user')).rejects.toThrow(AuthenticationError)
})

test('onRequest throws AuthenticationError when clock-expired and refresh fails', async () => {
  const expiredAuth: StoredAuth = { ...validAuth, tokenExpires: '2020-01-01T00:00:00.000Z' }

  mockFetch(makeResponse(401))   // /refreshToken fails

  const client = createClient({ getAuth: () => expiredAuth, onAuthUpdated: () => {} })

  await expect(client.GET('/user')).rejects.toThrow(AuthenticationError)
})
