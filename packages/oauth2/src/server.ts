import {DBAdapter, logger} from '@wepublish/api'
import pino from 'pino'
import pinoHttp from 'pino-http'
import express, {Application, NextFunction} from 'express'
import path from 'path'
import {MongoDBAdapter as OAuth2DBAdapter} from './adapter'
import {configuration} from './configuration'
import {Provider} from 'oidc-provider'
import set from 'lodash/set'
import url from 'url'
import {routes} from './routes'

export interface OAuth2ServerOpts {
  readonly clientID: string
  readonly clientSecret: string
  readonly grantTypes: string[]
  readonly redirectUris: string[]
  readonly cookieKeys: string[]
  readonly jwksKeys: any

  readonly issuer: string

  readonly mongoUrlOauth2: string
  readonly wepublishDDAdapter: DBAdapter

  readonly viewPath?: string
  readonly debug?: boolean
  readonly logger?: pino.Logger
}

let serverLogger: pino.Logger

const ONE_DAY_IN_MS = 1 * 24 * 60 * 60 * 1000

export class Oauth2Server {
  private readonly app: Application
  private readonly opts: OAuth2ServerOpts

  private readonly wepublishDDAdapter: DBAdapter

  constructor(opts: OAuth2ServerOpts) {
    const app = express()
    this.opts = opts
    this.wepublishDDAdapter = opts.wepublishDDAdapter

    serverLogger = opts.logger ? opts.logger : pino({name: 'oauth2'})

    /* const corsOptions = {
      origin: '*',
      allowedHeaders: [
        'authorization',
        'content-type',
        'content-length',
        'accept',
        'origin',
        'user-agent'
      ],
      methods: ['POST', 'GET', 'OPTIONS']
    } */

    app.use(
      pinoHttp({
        logger: serverLogger,
        useLevel: 'debug'
      })
    )

    app.use((err: any, req: Express.Request, res: Express.Response, next: NextFunction) => {
      logger('server').error(err)
      return next(err)
    })

    if (opts.viewPath) {
      app.set('views', opts.viewPath)
    } else {
      app.set('views', path.join(__dirname, '..', 'views'))
    }
    app.set('view engine', 'ejs')

    this.app = app
  }

  async findAccount(ctx: any, id: any) {
    const user = await this.wepublishDDAdapter.user.getUserByID(id)
    if (user) {
      return {
        accountId: user.id,
        email: user.email,
        async claims(use: any, scope: any) {
          console.log('claims', use, scope)
          return {sub: user.email, email: user.email}
        }
      }
    } else {
      throw new Error('did not find user')
    }
  }

  async listen(port?: number, hostname?: string): Promise<void> {
    await OAuth2DBAdapter.initialize(this.opts.mongoUrlOauth2, 'en')
    await OAuth2DBAdapter.connect(this.opts.mongoUrlOauth2)

    const config = {
      adapter: OAuth2DBAdapter,
      clients: [
        {
          client_id: this.opts.clientID,
          client_secret: this.opts.clientSecret,
          grant_types: this.opts.grantTypes,
          redirect_uris: this.opts.redirectUris
        }
      ],
      cookies: {
        long: {signed: true, maxAge: ONE_DAY_IN_MS},
        short: {signed: true},
        keys: this.opts.cookieKeys
      },
      jwks: {
        keys: this.opts.jwksKeys
      },
      findAccount: this.findAccount.bind(this),
      ...configuration
    }

    const provider = new Provider(this.opts.issuer, config)

    if (process.env.NODE_ENV === 'production') {
      this.app.enable('trust proxy')
      provider.proxy = true
      set(configuration, 'cookies.short.secure', true)
      set(configuration, 'cookies.long.secure', true)

      this.app.use((req, res, next) => {
        if (req.secure) {
          next()
        } else if (req.method === 'GET' || req.method === 'HEAD') {
          res.redirect(
            url.format({
              protocol: 'https',
              host: req.get('host'),
              pathname: req.originalUrl
            })
          )
        } else {
          res.status(400).json({
            error: 'invalid_request',
            error_description: 'do yourself a favor and only use https'
          })
        }
      })
    }

    routes(this.app, provider, this.wepublishDDAdapter)
    this.app.use(provider.callback)
    console.log('views_path', path.join(__dirname, 'views'))
    this.app.listen(port ?? 4200, hostname ?? 'localhost')
  }
}
