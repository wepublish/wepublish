import {NextFunction, Response, Router} from 'express'
import axios from 'axios'
import qs from 'qs'
import {Client, generators, Issuer} from 'openid-client'
import {MemoryStorageAdapter} from '@wepublish/api-storage-memory'
import {KarmaStorageAdapter} from '@wepublish/api-storage-karma/lib'

const authApp = Router()

const OAUTH_GOOGLE_ENABLED = true
const OAUTH_GOOGLE_CLIENT_ID =
  '617896178757-i6ldn0nni9qtle8o6eu76lv93d78nvfi.apps.googleusercontent.com'
const OAUTH_GOOGLE_KEY = 't267ZLqkV9dacrkPQp_pF-G2'
const OAUTH_GOOGLE_REDIRECT_URL = 'http://localhost:3000/auth/google'
const OAUTH_GOOGLE_SCOPE = 'openid profile email'

//const OAUTH_GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${OAUTH_GOOGLE_CLIENT_ID}&redirect_uri=${OAUTH_GOOGLE_REDIRECT_URL}&response_type=code&scope=${OAUTH_GOOGLE_SCOPE}&access_type=online`

const OAUTH_WEPUBLISH_ENABLED = true
const OAUTH_WEPUBLISH_CLIENT_ID = 'mike2'
const OAUTH_WEPUBLISH_KEY = 'some-secret'
const OAUTH_WEPUBLISH_REDIRECT_URL = 'http://localhost:3000/auth/wepublish'
const OAUTH_WEPUBLISH_SCOPE = 'openid'
//const OAUTH_WEPUBLISH_URL = `http://localhost:3010/oauth2/auth?client_id=${OAUTH_WEPUBLISH_CLIENT_ID}&redirect_uri=${OAUTH_WEPUBLISH_REDIRECT_URL}&response_type=code&scope=openid&state=1234qwer.`

let storageAdapter: MemoryStorageAdapter | KarmaStorageAdapter
let googleClient: Client
let wepublishClient: Client

authApp.get('/login', async (req, res, next) => {
  const code_verifier = generators.codeVerifier()
  const code_challenge = generators.codeChallenge(code_verifier)
  const googleUrl = googleClient.authorizationUrl({
    scope: OAUTH_GOOGLE_SCOPE,
    response_mode: 'form_post',
    code_challenge,
    code_challenge_method: 'S256'
  })
  const wepublishUrl = wepublishClient.authorizationUrl({
    scope: OAUTH_WEPUBLISH_SCOPE,
    //response_mode: 'form_post',
    state: code_verifier
  })
  res.cookie('code_verifier', code_verifier, {httpOnly: true})
  return res.send(`
  <html>
  <head>
      <title>WePublish Login</title>
  </head>
  <body>
      ${OAUTH_GOOGLE_ENABLED ? '<a href=' + googleUrl + '>Login with Google</a>' : ''}
      ${OAUTH_WEPUBLISH_ENABLED ? '<a href=' + wepublishUrl + '>Login with Wepublish</a>' : ''}
  </body>
  </html>
`)
})

authApp.post('/google', async (req, res, next) => {
  const params = googleClient.callbackParams(req)
  try {
    const {code_verifier} = req.cookies
    const token = await googleClient.callback(OAUTH_GOOGLE_REDIRECT_URL, params, {code_verifier})
    // @ts-ignore
    const userInfo = await googleClient.userinfo(token.access_token)
    const user = await storageAdapter.getUser(userInfo.email)
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
  const params = wepublishClient.callbackParams(req)
  try {
    const {code_verifier} = req.cookies
    const token = await wepublishClient.callback(OAUTH_WEPUBLISH_REDIRECT_URL, params, {
      state: code_verifier
    })
    // @ts-ignore
    const userInfo = await wepublishClient.userinfo(token.access_token)
    const user = await storageAdapter.getUser(userInfo.email)
    if (!user) {
      return res.sendStatus(401)
    }
    return res.redirect(`/auth/login?user=${user.email}`)
  } catch (error) {
    return next(error)
  }
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
      return acceptWepublishLogin(login_challenge, res, next, {subject})
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
    return acceptWepublishLogin(login_challenge, res, next, {email})
  } catch (error) {
    return next(error)
  }
})

const acceptWepublishLogin = async function(
  login_challenge: String,
  res: Response,
  next: NextFunction,
  data: Object
) {
  // @ts-ignore
  const {subject, email} = data
  try {
    const body = {
      subject: subject || email,
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
}

authApp.get('/wepublish/consent', async (req, res, next) => {
  const {consent_challenge} = req.query
  try {
    console.log('constent_challenge', consent_challenge)
    const {data} = await axios.get(
      `http://localhost:3011/oauth2/auth/requests/consent?${qs.stringify({consent_challenge})}`
    )
    if (data.skip) {
      return await acceptWepublishConsent(consent_challenge, res, next)
    } else if (true) {
      // TODO: check if any scope is needed
      return await acceptWepublishConsent(consent_challenge, res, next)
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
  return await acceptWepublishConsent(consent_challenge, res, next)
})

const acceptWepublishConsent = async function(
  consent_challenge: String,
  res: Response,
  next: NextFunction
) {
  try {
    // @ts-ignore
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
}

authApp.get('/wepublish/userinfo', async (req, res, next) => {
  console.log('userinfo', req)
  const {authorization = ''} = req.headers
  try {
    const body = {
      token: authorization.slice(7)
    }
    const acceptRes = await axios.post(
      `http://localhost:3011/oauth2/introspect`,
      qs.stringify(body),
      {
        headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json'},
        auth: {
          username: 'mike2',
          password: authorization.slice(7)
        }
      }
    )
    if (acceptRes.status === 200) {
      return res.json({
        sub: acceptRes.data.sub,
        email: acceptRes.data.sub
      })
    } else {
      return res.sendStatus(acceptRes.status)
    }
  } catch (error) {
    return next(error)
  }
})

const getAuthApp = async function(
  globalStorageAdapter: MemoryStorageAdapter | KarmaStorageAdapter
) {
  storageAdapter = globalStorageAdapter
  const googleIssuer = await Issuer.discover('https://accounts.google.com')
  googleClient = new googleIssuer.Client({
    client_id: OAUTH_GOOGLE_CLIENT_ID,
    client_secret: OAUTH_GOOGLE_KEY,
    redirect_uris: [OAUTH_GOOGLE_REDIRECT_URL],
    response_types: ['code']
  })
  const wepublishIssuer = await Issuer.discover('http://localhost:3010')
  wepublishClient = new wepublishIssuer.Client({
    client_id: OAUTH_WEPUBLISH_CLIENT_ID,
    client_secret: OAUTH_WEPUBLISH_KEY,
    redirect_uris: [OAUTH_WEPUBLISH_REDIRECT_URL],
    response_types: ['code']
  })
  return authApp
}

export default getAuthApp
