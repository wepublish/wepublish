import {Application, NextFunction, Request, Response} from 'express'
import Provider from 'oidc-provider'
import {urlencoded} from 'express'
import isEmpty from 'lodash/isEmpty'
import querystring from 'querystring'
import {inspect} from 'util'

import * as assert from 'assert'
import {MongoDBAdapter} from '@wepublish/api-db-mongodb/lib'

const body = urlencoded({extended: false})

const keys = new Set()
const debug = (obj: any) =>
  querystring.stringify(
    Object.entries(obj).reduce((acc: any, [key, value]) => {
      keys.add(key)
      if (isEmpty(value)) return acc
      acc[key] = inspect(value, {depth: null})
      return acc
    }, {}),
    '<br/>',
    ': ',
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value
      }
    }
  )

export function routes(app: Application, provider: Provider, dbAdapter: MongoDBAdapter): void {
  //const { constructor: { errors: { SessionNotFound } } } = provider;

  app.use((req, res, next) => {
    const orig = res.render
    // you'll probably want to use a full blown render engine capable of layouts
    res.render = (view: string, locals: any) => {
      app.render(view, locals, (err, html) => {
        if (err) throw err
        orig.call(res, '_layout', {
          ...locals,
          body: html
        })
      })
    }
    next()
  })

  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('Pragma', 'no-cache')
    res.set('Cache-Control', 'no-cache, no-store')
    next()
  }

  app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
    try {
      const {uid, prompt, params, session} = await provider.interactionDetails(req, res)

      const client = await provider.Client.find(params.client_id)

      switch (prompt.name) {
        case 'login': {
          return res.render('login', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Sign-in',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          })
        }
        case 'consent': {
          return res.render('interaction', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Authorize',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          })
        }
        /*case 'select_account': {
          if (!session) {
            return provider.interactionFinished(req, res, { select_account: {} }, { mergeWithLastSubmission: false });
          }

          const account = await provider.Account.findAccount(undefined, session.accountId);
          const { email } = await account.claims('prompt', 'email', { email: null }, []);

          return res.render('select_account', {
            client,
            uid,
            email,
            details: prompt.details,
            params,
            title: 'Sign-in',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
          });
        }*/
        default:
          return undefined
      }
    } catch (err) {
      return next(err)
    }
  })

  app.post('/interaction/:uid/login', setNoCache, body, async (req, res, next) => {
    try {
      const {
        prompt: {name}
      } = await provider.interactionDetails(req, res)
      assert.equal(name, 'login')
      const account = await dbAdapter.user.getUserForCredentials({
        email: req.body.login,
        password: req.body.password
      })
      if (!account) {
        throw new Error('User not found')
      }

      const result = {
        select_account: {}, // make sure its skipped by the interaction policy since we just logged in
        login: {
          account: account.id
        }
      }

      await provider.interactionFinished(req, res, result, {mergeWithLastSubmission: false})
    } catch (err) {
      next(err)
    }
  })

  app.post('/interaction/:uid/continue', setNoCache, body, async (req, res, next) => {
    try {
      const interaction = await provider.interactionDetails(req, res)
      const {
        prompt: {name}
      } = interaction
      assert.equal(name, 'select_account')

      if (req.body.switch) {
        if (interaction.params.prompt) {
          const prompts = new Set(interaction.params.prompt.split(' '))
          prompts.add('login')
          interaction.params.prompt = [...prompts].join(' ')
        } else {
          interaction.params.prompt = 'logout'
        }
        await interaction.save()
      }

      const result = {select_account: {}}
      await provider.interactionFinished(req, res, result, {mergeWithLastSubmission: false})
    } catch (err) {
      next(err)
    }
  })

  app.post('/interaction/:uid/confirm', setNoCache, body, async (req, res, next) => {
    try {
      const {
        prompt: {name}
      } = await provider.interactionDetails(req, res)
      assert.equal(name, 'consent')

      const consent: any = {}

      // any scopes you do not wish to grant go in here
      //   otherwise details.scopes.new.concat(details.scopes.accepted) will be granted
      consent.rejectedScopes = []

      // any claims you do not wish to grant go in here
      //   otherwise all claims mapped to granted scopes
      //   and details.claims.new.concat(details.claims.accepted) will be granted
      consent.rejectedClaims = []

      // replace = false means previously rejected scopes and claims remain rejected
      // changing this to true will remove those rejections in favour of just what you rejected above
      consent.replace = false

      const result = {consent}
      await provider.interactionFinished(req, res, result, {mergeWithLastSubmission: true})
    } catch (err) {
      next(err)
    }
  })

  app.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
    try {
      const result = {
        error: 'access_denied',
        error_description: 'End-User aborted interaction'
      }
      await provider.interactionFinished(req, res, result, {mergeWithLastSubmission: false})
    } catch (err) {
      next(err)
    }
  })

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    /*if (err instanceof SessionNotFound) {
      // handle interaction expired / session not found error
    }*/
    next(err)
  })
}
