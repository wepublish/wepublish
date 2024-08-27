import {Response} from 'express'
import {Controller, Get, Res} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {SettingName} from '@wepublish/settings/api'

@Controller('scripts')
export class ScriptsController {
  constructor(private readonly prismaService: PrismaClient) {}

  @Get('head.js')
  headScript(@Res() res: Response) {
    return this.serveScript(res, SettingName.HEAD_SCRIPT)
  }

  @Get('body.js')
  bodyScript(@Res() res: Response) {
    return this.serveScript(res, SettingName.BODY_SCRIPT)
  }

  private async serveScript(res: Response, name: string) {
    const script = await this.prismaService.setting.findFirst({
      where: {
        name
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
