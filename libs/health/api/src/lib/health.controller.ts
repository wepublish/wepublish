import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  HttpHealthIndicator
} from '@nestjs/terminus'
import {Controller, Get, NotFoundException} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import * as process from 'process'
import {promises as fs} from 'fs'

@Controller('health')
export class HealthController {
  private versionString: string | null = null

  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private http: HttpHealthIndicator,
    private prisma: PrismaClient
  ) {}

  async onModuleInit() {
    try {
      this.versionString = await fs.readFile('.version', 'utf-8')
      console.log(`Found API version: ${this.versionString}`)
    } catch (error) {
      this.versionString = null
      if (error instanceof Error) {
        console.error('Error reading .version file:', error.message)
      } else {
        console.error('Unknown error reading .version file')
      }
    }
  }

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

  @Get('version')
  version() {
    if (!this.versionString) {
      throw new NotFoundException('Version file not found')
    }
    return this.versionString
  }
}
