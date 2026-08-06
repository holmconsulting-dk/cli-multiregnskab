import { createClient, readAuth, writeAuth } from '@holmconsulting/multiregnskab-api'

let client: ReturnType<typeof createClient> | undefined

export function getClient() {
  if (!client) {
    client = createClient({
      getAuth: readAuth,
      onAuthUpdated: writeAuth,
    })
  }
  return client
}
