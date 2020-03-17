import {NextFunction, Request, Response, Router} from 'express'
import axios from 'axios'
import qs from 'qs'
import {Client, generators, Issuer} from 'openid-client'

const authApp: Router = Router()

const OAUTH_GOOGLE_ENABLED = true
const OAUTH_GOOGLE_CLIENT_ID =
  '617896178757-i6ldn0nni9qtle8o6eu76lv93d78nvfi.apps.googleusercontent.com'
const OAUTH_GOOGLE_KEY = 't267ZLqkV9dacrkPQp_pF-G2'
const OAUTH_GOOGLE_REDIRECT_URL = 'http://localhost:4000/auth/google'
const OAUTH_GOOGLE_SCOPE = 'openid profile email'

const OAUTH_WEPUBLISH_ENABLED = true
const OAUTH_WEPUBLISH_CLIENT_ID = 'mike'
const OAUTH_WEPUBLISH_KEY = 'some-secret'
const OAUTH_WEPUBLISH_REDIRECT_URL = 'http://localhost:4000/auth/wepublish'
const OAUTH_WEPUBLISH_SCOPE = 'openid'

const clients = new Map<string, Client>()

authApp.all('*', async (req, res, next) => {
  if (!clients.has('google') && OAUTH_GOOGLE_ENABLED) {
    const googleIssuer = await Issuer.discover('https://accounts.google.com')
    clients.set(
      'google',
      new googleIssuer.Client({
        client_id: OAUTH_GOOGLE_CLIENT_ID,
        client_secret: OAUTH_GOOGLE_KEY,
        redirect_uris: [OAUTH_GOOGLE_REDIRECT_URL],
        response_types: ['code']
      })
    )
  }

  if (!clients.get('wepublish') && OAUTH_WEPUBLISH_ENABLED) {
    const wepublishIssuer = await Issuer.discover('http://localhost:4010')
    clients.set(
      'wepublish',
      new wepublishIssuer.Client({
        client_id: OAUTH_WEPUBLISH_CLIENT_ID,
        client_secret: OAUTH_WEPUBLISH_KEY,
        redirect_uris: [OAUTH_WEPUBLISH_REDIRECT_URL],
        response_types: ['code']
      })
    )
  }
  next()
})

authApp.get('/login', async (req, res, next) => {
  const code_verifier = generators.codeVerifier()
  const code_challenge = generators.codeChallenge(code_verifier)
  //@ts-ignore
  const googleUrl = clients.get('google').authorizationUrl({
    scope: OAUTH_GOOGLE_SCOPE,
    response_mode: 'form_post',
    code_challenge,
    code_challenge_method: 'S256'
  })
  //@ts-ignore
  const wepublishUrl = clients.get('wepublish').authorizationUrl({
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

authApp.post('/google', async (req: Request, res, next) => {
  //@ts-ignore
  const params = clients.get('google').callbackParams(req)
  try {
    const {code_verifier} = req.cookies
    //@ts-ignore
    const token = await clients
      .get('google')
      .callback(OAUTH_GOOGLE_REDIRECT_URL, params, {code_verifier})
    //@ts-ignore
    const userInfo = await clients.get('google').userinfo(token.access_token)
    const storageAdapter = req.wpContext.dbAdapter
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
  const client = clients.get('wepublish')
  if (client === undefined) {
    return res.sendStatus(401)
  }

  const params = client.callbackParams(req)
  try {
    const {code_verifier} = req.cookies
    const token = await client.callback(OAUTH_WEPUBLISH_REDIRECT_URL, params, {
      state: code_verifier
    })
    const userInfo = await client.userinfo(token.access_token ?? '')
    const storageAdapter = req.wpContext.dbAdapter
    const user = await storageAdapter.getUser(userInfo.email ?? '')
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
      `http://localhost:4011/oauth2/auth/requests/login?${qs.stringify({login_challenge})}`
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
    // @ts-ignore
    const storageAdapter = req.wpContext.dbAdapter
    const user = await storageAdapter.getUserForCredentials({email, password})
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
      `http://localhost:4011/oauth2/auth/requests/login/accept?${qs.stringify({login_challenge})}`,
      JSON.stringify(body),
      {headers: {'Content-Type': 'application/json'}}
    )
    if (acceptRes.status === 200) {
      //@ts-ignore
      return res.redirect(acceptRes.data.redirect_to)
    } else {
      //@ts-ignore
      return res.sendStatus(acceptRes.status)
    }
  } catch (error) {
    return next(error)
  }
}

authApp.get('/wepublish/consent', async (req, res, next) => {
  const {consent_challenge} = req.query
  try {
    const {data} = await axios.get(
      `http://localhost:4011/oauth2/auth/requests/consent?${qs.stringify({consent_challenge})}`
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
      `http://localhost:4011/oauth2/auth/requests/consent/accept?${qs.stringify({
        consent_challenge
      })}`,
      JSON.stringify(body),
      {headers: {'Content-Type': 'application/json'}}
    )
    if (acceptRes.status === 200) {
      //@ts-ignore
      return res.redirect(acceptRes.data.redirect_to)
    } else {
      //@ts-ignore
      return res.sendStatus(acceptRes.status)
    }
  } catch (error) {
    return next(error)
  }
}

authApp.get('/wepublish/userinfo', async (req: Request, res: Response, next) => {
  const {authorization = ''} = req.headers
  try {
    const body = {
      token: authorization.slice(7)
    }
    const acceptRes = await axios.post(
      `http://localhost:4011/oauth2/introspect`,
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
      //@ts-ignore
      return res.json({
        sub: acceptRes.data.sub,
        email: acceptRes.data.sub
      })
    } else {
      //@ts-ignore
      return res.sendStatus(acceptRes.status)
    }
  } catch (error) {
    return next(error)
  }
})

export default authApp
