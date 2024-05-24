import {PrismaClient} from '@prisma/client'
import express, {NextFunction, Request, Response} from 'express'
import compression from 'compression'
import {SettingName} from '..'

export class StaticRouter {
  private router = express.Router()

  constructor(private prismaClient: PrismaClient) {
    this.router.use(compression())
    this.router.get('/head.js', this.serveScript(SettingName.HEAD_SCRIPT))
    this.router.get('/body.js', this.serveScript(SettingName.BODY_SCRIPT))
  }

  public getRouter() {
    return this.router
  }

  private serveScript(settingName: string) {
    return async (_req: Request, res: Response, _next: NextFunction) => {
      const script = await this.prismaClient.setting.findFirst({
        where: {
          name: settingName
        }
      })
      res.setHeader('Content-Type', 'application/javascript')
      res.setHeader('Referrer-Policy', 'no-referrer')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      if (script) {
        res.send(script.value)
      } else {
        res.send('')
      }
    }
  }
}
