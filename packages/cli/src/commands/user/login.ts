import { loginWithPassword, writeAuth } from '@holmconsulting/multiregnskab-api'
import { prompt, promptPassword } from '../../lib/prompt.js'

export async function login() {
  const username = await prompt('Username: ')
  const password = await promptPassword('Password: ')
  try {
    const auth = await loginWithPassword(username, password)
    writeAuth(auth)
    console.log('Logged in successfully.')
  } catch (e) {
    console.error(e instanceof Error ? e.message : 'Login failed.')
    process.exit(1)
  }
}
