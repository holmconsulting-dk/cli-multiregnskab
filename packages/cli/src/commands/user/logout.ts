import { clearAuth } from '@holmconsulting-dk/multiregnskab-api'
import { getClient } from '../../lib/client.js'

export async function logout() {
  const client = getClient()
  // best-effort server-side invalidation — ignore errors (expired token, not logged in, etc.)
  await client.DELETE('/tokens', {
    body: {
      applyToAllTokensByUser: false,
      invalidateNow: true,
      expireAccessTokenNow: false,
      expireRefreshTokenNow: false,
    },
  }).catch(() => {})
  clearAuth()
  console.log('Logged out.')
}
