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

const OAUTH_WEPUBLISH_ENABLED = true
const OAUTH_WEPUBLISH_CLIENT_ID = 'wepublish'
const OAUTH_WEPUBLISH_KEY = 'some-secret'
const OAUTH_WEPUBLISH_REDIRECT_URL = 'http://localhost:3000/auth/wepublish'
const OAUTH_WEPUBLISH_URL = `http://localhost:3010/oauth2/auth?client_id=${OAUTH_WEPUBLISH_CLIENT_ID}&redirect_uri=${OAUTH_WEPUBLISH_REDIRECT_URL}&response_type=code&scope=openid&state=1234qwer.`

let storageAdapter: MemoryStorageAdapter | KarmaStorageAdapter

authApp.get('/login', (req, res) => {
  return res.send(`
    <html>
    <head>
        <title>WePublish Login</title>
    </head>
    <body>
        ${OAUTH_GOOGLE_ENABLED ? '<a href=' + OAUTH_GOOGLE_URL + '>Login with Google</a>' : ''}
        ${
          OAUTH_WEPUBLISH_ENABLED
            ? '<a href=' + OAUTH_WEPUBLISH_URL + '>Login with Wepublish</a>'
            : ''
        }
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

authApp.get('/wepublish', async (req, res, next) => {
  console.log(req.query)
  const {code /*openid, state*/} = req.query
  const body = {
    code,
    client_id: OAUTH_WEPUBLISH_CLIENT_ID,
    client_secret: OAUTH_WEPUBLISH_KEY,
    redirect_uri: OAUTH_WEPUBLISH_REDIRECT_URL,
    grant_type: 'authorization_code'
  }
  const config = {
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
    }
  }

  try {
    const tokenRes = await axios.post(
      'http://localhost:3010/oauth2/token',
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
  return res.redirect(`/auth/login?user=${'bla'}`)
})

authApp.get('/wepublish/login', async (req, res, next) => {
  const {login_challenge} = req.query
  try {
    const {
      data: {skip, subject}
    } = await axios.get(
      `http://localhost:3011/oauth2/auth/requests/login?${qs.stringify({login_challenge})}`
    )
    if (skip) {
      const body = {
        subject,
        remember: true,
        remember_for: 3600
      }
      const acceptRes = await axios.put(
        `http://localhost:3011/oauth2/auth/requests/login/accept?${qs.stringify({
          login_challenge
        })}`,
        JSON.stringify(body),
        {headers: {'Content-Type': 'application/json'}}
      )
      if (acceptRes.status === 200) {
        return res.redirect(acceptRes.data.redirect_to)
      } else {
        return res.sendStatus(acceptRes.status)
      }
    } else {
      return res.send(`
        <html>
        <head>
            <title>WePublish Login</title>
        </head>
        <body>
            <form action="/auth/wepublish/login" method="post">
              <label for="user">Email:</label><br>
              <input type="text" id="email" name="email"><br>
              <label for="password">Password:</label><br>
              <input type="password" id="password" name="password"><br><br>
              <input type="hidden" id="login_challenge" name="login_challenge" value="${login_challenge}">
              <input type="submit" value="Login">
            </form>
        </body>
        </html>
      `)
    }
  } catch (error) {
    return next(error)
  }
})

authApp.post('/wepublish/login', async (req, res, next) => {
  const {email, password, login_challenge} = req.body
  try {
    const user = await storageAdapter.getUserForCredentials(email, password)
    if (!user) {
      return res.sendStatus(401)
    }
    const body = {
      subject: 'login',
      remember: true,
      remember_for: 3600
    }
    const acceptRes = await axios.put(
      `http://localhost:3011/oauth2/auth/requests/login/accept?${qs.stringify({login_challenge})}`,
      JSON.stringify(body),
      {headers: {'Content-Type': 'application/json'}}
    )
    if (acceptRes.status === 200) {
      return res.redirect(acceptRes.data.redirect_to)
    } else {
      return res.sendStatus(acceptRes.status)
    }
  } catch (error) {
    return next(error)
  }
})

authApp.get('/wepublish/consent', async (req, res, next) => {
  const {consent_challenge} = req.query
  try {
    console.log('constent_challenge', consent_challenge)
    const {data} = await axios.get(
      `http://localhost:3011/oauth2/auth/requests/consent?${qs.stringify({consent_challenge})}`
    )
    if (data.skip) {
      const body = {
        grant_scope: ['openid'],
        grant_access_token_audience: ['openid'],
        remember: true,
        remember_for: 3600
      }
      const acceptRes = await axios.put(
        `http://localhost:3011/oauth2/auth/requests/consent/accept?${qs.stringify({
          consent_challenge
        })}`,
        JSON.stringify(body),
        {headers: {'Content-Type': 'application/json'}}
      )
      if (acceptRes.status === 200) {
        return res.redirect(acceptRes.data.redirect_to)
      } else {
        return res.sendStatus(acceptRes.status)
      }
    } else {
      return res.send(`
        <html>
        <head>
            <title>WePublish Login</title>
        </head>
        <body>
            <form action="/auth/wepublish/consent" method="post">
              <label for="scope">Requested Scopes:</label><br>
              <ul>
                ${data.requested_scope.map((scope: string) => `<li>${scope}</li>`)}
              </ul>
              <input type="hidden" id="consent_challenge" name="consent_challenge" value="${consent_challenge}">
              <input type="submit" value="Accept">
            </form>
        </body>
        </html>
      `)
    }
  } catch (error) {
    return next(error)
  }
})

authApp.post('/wepublish/consent', async (req, res, next) => {
  const {consent_challenge} = req.body
  try {
    const body = {
      grant_scope: ['openid'],
      grant_access_token_audience: ['openid'],
      remember: true,
      remember_for: 3600
    }
    const acceptRes = await axios.put(
      `http://localhost:3011/oauth2/auth/requests/consent/accept?${qs.stringify({
        consent_challenge
      })}`,
      JSON.stringify(body),
      {headers: {'Content-Type': 'application/json'}}
    )
    if (acceptRes.status === 200) {
      return res.redirect(acceptRes.data.redirect_to)
    } else {
      return res.sendStatus(acceptRes.status)
    }
  } catch (error) {
    return next(error)
  }
})

const getAuthApp = function(globalStorageAdapter: MemoryStorageAdapter | KarmaStorageAdapter) {
  storageAdapter = globalStorageAdapter
  return authApp
}

export default getAuthApp
