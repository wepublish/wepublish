import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  HttpHealthIndicator
} from '@nestjs/terminus'
import {Controller, Get} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import * as process from 'process'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private http: HttpHealthIndicator,
    private prisma: PrismaClient
  ) {}

  @Get()
  @HealthCheck()
  readiness() {
    return this.health.check([
      async () => this.db.pingCheck('database', this.prisma),
      async () => this.http.pingCheck('editor', `${process.env.EDITOR_URL}`),
      async () => this.http.pingCheck('website', `${process.env.WEBSITE_URL}`),
      async () => this.http.pingCheck('media-server', `${process.env.MEDIA_SERVER_URL}/health`)
    ])
  }

  @Get('readinessProbe')
  @HealthCheck()
  readinessProbe() {
    return this.health.check([async () => this.db.pingCheck('database', this.prisma)])
  }

  @Get('livenessProbe')
  @HealthCheck()
  livenessProbe() {
    return this.health.check([async () => this.db.pingCheck('database', this.prisma)])
  }

  @Get('startupProbe')
  @HealthCheck()
  startupProbe() {
    return this.health.check([async () => this.db.pingCheck('database', this.prisma)])
  }
}
