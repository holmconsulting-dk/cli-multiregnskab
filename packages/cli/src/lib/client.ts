import { createClient, readAuth, writeAuth } from '@holmconsulting/multiregnskab-api'

export function getClient() {
  return createClient({
    getAuth: readAuth,
    onAuthUpdated: writeAuth,
  })
}
