import { createArea } from '../../lib/area.js'
import { login } from './login.js'
import { logout } from './logout.js'
import { show } from './show.js'

export const userArea = createArea({
  name: 'user',
  description: 'Manage authentication and user account',
  info: 'The user area handles login, logout, and retrieving user information.',
  subcommands: [
    {
      name: 'login',
      description: 'Log in to Multiregnskab',
      info: 'Authenticates with username and password. The session token is stored locally and reused for subsequent commands.',
      action: login,
    },
    {
      name: 'logout',
      description: 'Log out and invalidate the current session',
      info: 'Invalidates the current token on the server and removes the locally stored session.',
      action: logout,
    },
    {
      name: 'show',
      description: 'Show information about the logged-in user',
      info: 'Displays the username, real name, and administrator information for the current session.',
      action: show,
    },
  ],
})
