import { createClient, clearAuth } from '@holmconsulting/multiregnskab-api'

export async function logout() {
  const client = createClient()
  await client.DELETE('/tokens', {
    body: {
      applyToAllTokensByUser: false,
      invalidateNow: true,
      expireAccessTokenNow: false,
      expireRefreshTokenNow: false,
    },
  })
  clearAuth()
  console.log('Logged out.')
}
