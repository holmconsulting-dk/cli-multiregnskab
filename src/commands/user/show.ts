import { Command } from 'commander'
import { createClient, readAuth } from '../../api/client.js'
import { apiError } from '../../lib/error.js'

export async function show(_options: unknown, cmd: Command) {
  const auth = readAuth()
  if (!auth?.token) {
    console.error('Not logged in. Run: mr user login')
    process.exit(1)
  }

  const client = createClient()
  const { data, error, response } = await client.GET('/user')

  if (error || !data) {
    apiError(cmd, 'Failed to retrieve user information.', error, response)
  }

  console.log(`Username:  ${data.userName ?? '-'}`)
  console.log(`Real name: ${data.realName ?? '-'}`)
  if (data.administratorName) {
    console.log(`Administrator: ${data.administratorName} (${data.administratorRole})`)
  }
}
