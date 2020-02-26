import {Router} from 'express'
import axios from 'axios'
import qs from 'qs'
import {MemoryStorageAdapter} from '@wepublish/api-storage-memory'
import {KarmaStorageAdapter} from '@wepublish/api-storage-karma/lib'

const authApp = Router()

const OAUTH_GOOGLE_ENABLED = true
const OAUTH_GOOGLE_CLIENT_ID =
  '617896178757-i6ldn0nni9qtle8o6eu76lv93d78nvfi.apps.googleusercontent.com'
const OAUTH_GOOGLE_KEY = 't267ZLqkV9dacrkPQp_pF-G2'
const OAUTH_GOOGLE_REDIRECT_URL = 'http://localhost:3000/auth/google'
const OAUTH_GOOGLE_SCOPE = 'openid%20profile%20email'

const OAUTH_GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${OAUTH_GOOGLE_CLIENT_ID}&redirect_uri=${OAUTH_GOOGLE_REDIRECT_URL}&response_type=code&scope=${OAUTH_GOOGLE_SCOPE}&access_type=online`

let storageAdapter: MemoryStorageAdapter | KarmaStorageAdapter

authApp.get('/login', (req, res) => {
  return res.send(`
    <html>
    <head>
        <title>WePublish Login</title>
    </head>
    <body>
        ${OAUTH_GOOGLE_ENABLED ? '<a href=' + OAUTH_GOOGLE_URL + '>Login with Google</a>' : ''}
    </body>
    </html>
  `)
})

authApp.get('/google', async (req, res, next) => {
  const {code} = req.query
  const body = {
    code,
    client_id: OAUTH_GOOGLE_CLIENT_ID,
    client_secret: OAUTH_GOOGLE_KEY,
    redirect_uri: OAUTH_GOOGLE_REDIRECT_URL,
    grant_type: 'authorization_code'
  }
  const config = {
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
    }
  }

  try {
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify(body),
      config
    )
    const userRes = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenRes.data.access_token}`
      }
    })
    console.log('User', userRes.data)
    const user = await storageAdapter.getUser(userRes.data.email)
    if (!user) {
      return res.sendStatus(401)
    }
    return res.redirect(`/auth/login?user=${user.email}`)
  } catch (error) {
    return next(error)
  }
})

const getAuthApp = function(globalStorageAdapter: MemoryStorageAdapter | KarmaStorageAdapter) {
  storageAdapter = globalStorageAdapter
  return authApp
}

export default getAuthApp
