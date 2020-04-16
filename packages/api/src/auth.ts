import {NextFunction, Request, Response, Router} from 'express'
import axios from 'axios'
import qs from 'qs'

const authApp: Router = Router()

const HYDRA_ADMIN_DOMAIN = process.env.HYDRA_ADMIN_DOMAIN

authApp.get('/login', async (req, res, next) => {
  if (!HYDRA_ADMIN_DOMAIN) {
    return next(new Error('Missing Settings'))
  }
  const {login_challenge} = req.query
  try {
    const {
      data: {skip, subject}
    } = await axios.get(
      `${HYDRA_ADMIN_DOMAIN}/oauth2/auth/requests/login?${qs.stringify({login_challenge})}`
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
            <form action="" method="post">
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

authApp.post('/login', async (req, res, next) => {
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
  data: any
) {
  const {subject, email} = data
  try {
    const body = {
      subject: subject || email,
      remember: true,
      remember_for: 3600
    }
    const acceptRes = await axios.put(
      `${HYDRA_ADMIN_DOMAIN}/oauth2/auth/requests/login/accept?${qs.stringify({login_challenge})}`,
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

authApp.get('/consent', async (req, res, next) => {
  const {consent_challenge} = req.query
  try {
    await axios.get(
      `${HYDRA_ADMIN_DOMAIN}/oauth2/auth/requests/consent?${qs.stringify({consent_challenge})}`
    )
    // at the moment no need for consent
    return await acceptWepublishConsent(consent_challenge, res, next)
  } catch (error) {
    return next(error)
  }
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
      `${HYDRA_ADMIN_DOMAIN}/oauth2/auth/requests/consent/accept?${qs.stringify({
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

authApp.get('/userinfo', async (req: Request, res: Response, next) => {
  const {authorization = ''} = req.headers
  try {
    const body = {
      token: authorization.slice(7)
    }
    const acceptRes = await axios.post(`${HYDRA_ADMIN_DOMAIN}/introspect`, qs.stringify(body), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json'},
      auth: {
        username: 'mike8',
        password: authorization.slice(7)
      }
    })
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
