import {
  Controller,
  Get,
  Inject,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import * as os from 'os';
import * as fs from 'fs';
import { timingSafeEqual } from 'crypto';

@Controller('systemInfo')
export class SystemInfoController {
  constructor(@Inject('SYSTEM_INFO_KEY') private key: string) {}

  @Get()
  getSystemInfo(@Query('key') key: string): {
    hostname: string;
    ips: string[];
    isKubernetes: boolean;
    database: string | unknown;
    mediaServer: string;
    configFilePath: string;
    apiUrl: string;
    websiteUrl: string;
  } {
    if (!this.timeConstantCompare(key, this.key)) {
      throw new UnauthorizedException('Invalid key');
    }

    const hostname = os.hostname();
    const ips = this.getIps();
    const isKubernetes = this.isRunningInKubernetes();
    const database = this.getDatabaseName(process.env['DATABASE_URL'] || '');
    const mediaServer = process.env['MEDIA_SERVER_URL'] || '';
    const configFilePath = process.env['CONFIG_FILE_PATH'] || '';
    const apiUrl = process.env['API_URL'] || '';
    const websiteUrl = process.env['WEBSITE_URL'] || '';
    return {
      hostname,
      ips,
      isKubernetes,
      database,
      mediaServer,
      configFilePath,
      apiUrl,
      websiteUrl,
    };
  }

  private getIps(): string[] {
    const networkInterfaces = os.networkInterfaces();
    const ips: string[] = [];
    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];
      if (networkInterface) {
        for (const net of networkInterface) {
          ips.push(net.address);
        }
      }
    }
    return ips;
  }

  private timeConstantCompare(a: string, b: string): boolean {
    try {
      return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    } catch {
      return false;
    }
  }

  private getDatabaseName(databaseUrl: string): {
    host: string;
    databaseName: string | undefined;
  } {
    if (!databaseUrl)
      return {
        host: 'Unknown',
        databaseName: 'Unknown',
      };
    try {
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        databaseName: url.pathname.split('/').pop(),
      };
    } catch (error) {
      return {
        host: 'Unknown',
        databaseName: 'Unknown',
      };
    }
  }

  private isRunningInKubernetes(): boolean {
    return fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token');
  }
}
