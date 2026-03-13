import { createClient, clearAuth } from '../../api/client.js'

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
