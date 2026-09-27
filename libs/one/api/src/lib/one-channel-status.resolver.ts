import { Inject } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CanLoginEditor } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { OneChannelStateService } from './one-channel-state.service';
import {
  OneChannelConnectionState,
  OneChannelStatus,
} from './one-channel-status.model';
import { ONE_URL_TOKEN } from './one.tokens';

export const OUTAGE_THRESHOLD_MS = 6 * 60 * 60 * 1000;

@Resolver()
export class OneChannelStatusResolver {
  constructor(
    private state: OneChannelStateService,
    @Inject(ONE_URL_TOKEN) private oneURL: string
  ) {}

  @Permissions(CanLoginEditor)
  @Query(() => OneChannelStatus, { name: 'oneChannelStatus' })
  async getOneChannelStatus(): Promise<OneChannelStatus> {
    if (!this.oneURL) {
      return {
        state: OneChannelConnectionState.NotConfigured,
        oneUrl: null,
        lastSuccessAt: null,
        lastAttemptAt: null,
        lastError: null,
        unreachable: false,
      };
    }

    const { lastSuccessAt, lastAttemptAt, lastError } =
      await this.state.getState();
    const isConnected = lastAttemptAt !== null && lastError === null;

    return {
      state:
        isConnected ?
          OneChannelConnectionState.Connected
        : OneChannelConnectionState.Failing,
      oneUrl: this.oneURL,
      lastSuccessAt,
      lastAttemptAt,
      lastError,
      unreachable:
        !lastSuccessAt ||
        Date.now() - lastSuccessAt.getTime() > OUTAGE_THRESHOLD_MS,
    };
  }
}
