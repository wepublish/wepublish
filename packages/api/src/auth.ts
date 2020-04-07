import {NextFunction, Request, Response, Router} from 'express'
import axios from 'axios'
import qs from 'qs'
import {Client, generators, Issuer} from 'openid-client'

const authApp: Router = Router()

const clients = new Map<string, Client>()

authApp.all('*', async (req, res, next) => {
  req.wpContext.oauth2Providers.forEach(provider => {
    if (!clients.has(provider.name)) {
      Issuer.discover(provider.discoverUrl).then(issuer => {
        clients.set(
          provider.name,
          new issuer.Client({
            client_id: provider.clientId,
            client_secret: provider.clientKey,
            redirect_uris: provider.redirectUri,
            response_types: ['code']
          })
        )
      })
    }
  })
  next()
})

authApp.get('/login', async (req, res, next) => {
  const code_verifier = generators.codeVerifier()
  //const code_challenge = generators.codeChallenge(code_verifier)
  const logins: {url: string; name: any}[] = []
  clients.forEach((client, key) => {
    const url = client.authorizationUrl({
      scope: 'openid email ',
      response_mode: 'form_post',
      state: code_verifier
    })
    logins.push({
      url,
      name: key
    })
  })

  res.cookie('code_verifier', code_verifier, {httpOnly: true})
  return res.send(`
    <html>
    <head>
        <title>WePublish Login</title>
    </head>
    <body>
        ${logins.map(login => `<a href="${login.url}">${login.name}</a>`)}
    </body>
    </html>
  `)
})

authApp.get('/logins', async (req, res, next) => {
  const logins: {url: string; name: any}[] = []
  clients.forEach((client, key) => {
    const url = client.authorizationUrl({
      scope: 'openid email ',
      response_mode: 'form_post',
      redirect_uri: req.query.redirectUri
      //state: code_verifier
    })
    logins.push({
      url,
      name: key
    })
  })
  return res.json({
    logins
  })
})

authApp.post('/google', async (req: Request, res, next) => {
  //@ts-ignore
  const client = clients.get('google')
  if (!client) {
    return res.sendStatus(400)
  }
  const params = client.callbackParams(req)
  const redirect_uris = client.redirect_uris
  try {
    const {code_verifier} = req.cookies
    //@ts-ignore
    const token = await client.callback(redirect_uris[0], params, {state: code_verifier})
    //@ts-ignore
    const userInfo = await client.userinfo(token.access_token)
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
  //@ts-ignore
  const client = clients.get('wepublish')
  if (!client) {
    return res.sendStatus(400)
  }
  const params = client.callbackParams(req)
  try {
    const {code_verifier} = req.cookies
    const token = await client.callback('FAAAAKKKKEEE', params, {
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
