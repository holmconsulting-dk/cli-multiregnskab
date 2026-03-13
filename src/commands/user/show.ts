import { createClient, readAuth } from '../../api/client.js'

export async function show() {
  const auth = readAuth()
  if (!auth?.token) {
    console.error('Not logged in. Run: mr user login')
    process.exit(1)
  }

  const client = createClient()
  const { data, error } = await client.GET('/user')

  if (error || !data) {
    console.error('Failed to retrieve user information.')
    process.exit(1)
  }

  console.log(`Username:  ${data.userName ?? '-'}`)
  console.log(`Real name: ${data.realName ?? '-'}`)
  if (data.administratorName) {
    console.log(`Administrator: ${data.administratorName} (${data.administratorRole})`)
  }
}
