import { createUnauthenticatedClient, writeAuth } from '@holmconsulting/multiregnskab-api'
import { prompt, promptPassword } from '../../lib/prompt.js'

export async function login() {
  const username = await prompt('Username: ')
  const password = await promptPassword('Password: ')

  const client = createUnauthenticatedClient()
  const { data, error } = await client.POST('/login', {
    body: { userName: username, password },
  })

  if (error || !data) {
    console.error('Login failed. Check your username and password.')
    process.exit(1)
  }

  writeAuth({
    token: data.token,
    tokenExpires: data.tokenExpires,
    refreshToken: data.refreshToken,
  })

  console.log('Logged in successfully.')
}
