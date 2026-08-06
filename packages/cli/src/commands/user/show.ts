import { Command } from 'commander'
import { getClient } from '../../lib/client.js'
import { apiError } from '../../lib/error.js'

export async function show(_options: unknown, cmd: Command) {
  const client = getClient()
  const { data, error, response } = await client.GET('/user').catch((e) => apiError(cmd, 'Failed to retrieve user information.', e))

  if (error || !data) {
    apiError(cmd, 'Failed to retrieve user information.', error, response)
  }

  console.log(`Username:  ${data.userName ?? '-'}`)
  console.log(`Real name: ${data.realName ?? '-'}`)
  if (data.administratorName) {
    console.log(`Administrator: ${data.administratorName} (${data.administratorRole})`)
  }
}
