import { createUnauthenticatedClient, writeAuth } from '../../api/client.js'
import { prompt, promptPassword } from '../../lib/prompt.js'

export async function login() {
  const username = await prompt('Username: ')
  const password = await promptPassword('Password: ')

  const client = createUnauthenticatedClient()
  const { data, error, response } = await client.POST('/login', {
    body: { userName: username, password },
  })

  if (error || !data) {
    if (response && response.status === 401) {
      console.error('Login failed. Check your username and password.')
    } else if (response) {
      console.error(`Login failed. HTTP ${response.status} ${response.statusText}`)
    } else {
      console.error('Login failed. Could not reach the server.')
    }
    process.exit(1)
  }

  writeAuth({
    token: data.token,
    tokenExpires: data.tokenExpires,
    refreshToken: data.refreshToken,
  })

  console.log('Logged in successfully.')
}
