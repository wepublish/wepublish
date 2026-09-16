import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { promises as fs } from 'fs';
import { OneChannelStateService } from './one-channel-state.service';
import { OneClientService } from './one-client.service';
import { ONE_URL_TOKEN } from './one.tokens';

export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

export const VERSION_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export function sanitiseVersion(raw: string): string {
  const trimmed = raw.trim();

  return VERSION_PATTERN.test(trimmed) ? trimmed : 'unknown';
}

@Injectable()
export class OneHeartbeatService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OneHeartbeatService.name);

  constructor(
    private client: OneClientService,
    private state: OneChannelStateService,
    @Inject(ONE_URL_TOKEN) private oneURL: string
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.send();
  }

  @Interval(HEARTBEAT_INTERVAL_MS)
  async send(): Promise<void> {
    if (!this.oneURL) {
      return;
    }

    const version = await this.readVersion();

    try {
      await this.client.post('/channel/heartbeat', 'write:medium-heartbeat', {
        version,
        gitSha: version.slice(0, 7),
        nodeEnv: process.env['NODE_ENV'] ?? 'development',
      });

      await this.state.recordSuccess(new Date());
    } catch (error) {
      const message = (error as Error).message;
      this.state.recordFailure(new Date(), message);
      this.logger.error(`Heartbeat to ${this.oneURL} failed: ${message}`);
    }
  }

  private async readVersion(): Promise<string> {
    try {
      return sanitiseVersion(await fs.readFile('.version', 'utf-8'));
    } catch {
      return 'unknown';
    }
  }
}
