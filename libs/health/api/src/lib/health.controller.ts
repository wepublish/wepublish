import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { Controller, Get, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as process from 'process';
import { promises as fs } from 'fs';
import { Public } from '@wepublish/authentication/api';

@Controller('health')
export class HealthController {
  private versionString: string | null = null;

  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private http: HttpHealthIndicator,
    private prisma: PrismaClient
  ) {}

  async onModuleInit() {
    try {
      this.versionString = await fs.readFile('.version', 'utf-8');
      console.log(`Found API version: ${this.versionString}`);
    } catch (error) {
      this.versionString = null;
    }
  }

  @Public()
  @Get()
  @HealthCheck()
  readiness() {
    return this.health.check([
      async () => this.db.pingCheck('database', this.prisma),
      async () => this.http.pingCheck('editor', `${process.env['EDITOR_URL']}`),
      async () =>
        this.http.pingCheck('website', `${process.env['WEBSITE_URL']}`),
      async () =>
        this.http.pingCheck(
          'media-server',
          `${process.env['MEDIA_SERVER_URL']}/health`
        ),
    ]);
  }

  @Public()
  @Get('readinessProbe')
  @HealthCheck()
  readinessProbe() {
    return this.health.check([
      async () => this.db.pingCheck('database', this.prisma),
    ]);
  }

  @Public()
  @Get('startupProbe')
  startupProbe() {
    return { status: 'ok' };
  }

  @Public()
  @Get('livenessProbe')
  livenessProbe() {
    return { status: 'ok' };
  }

  @Public()
  @Get('version')
  version() {
    if (!this.versionString) {
      throw new NotFoundException('Version file not found');
    }
    return this.versionString;
  }
}
