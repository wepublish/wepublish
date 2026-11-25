import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { describeError } from '@wepublish/utils/api';
import { PaymentsService } from '../../payments.service';
import {
  BexioPaymentProvider,
  SyncContactUser,
} from './bexio-payment-provider';

/** What one night's push did for one bexio integration, for the job log. */
export interface BexioContactSyncResult {
  providerId: string;
  readers: number;
  pushed: number;
  failed: number;
  /** bexio stopped the push before every reader was tried. */
  stopped?: 'rate-limited' | 'key-rejected';
  firstError?: string;
}

/**
 * Pushes reader data to bexio contacts once a night, for every bexio
 * integration with the switch on: readers bexio already knows whose data
 * changed since their last push, and readers paying through bexio that bexio
 * has no contact for yet. One-way; bexio keeps the rest of its contact.
 */
@Injectable()
export class BexioContactSyncService {
  private readonly logger = new Logger('BexioContactSyncService');
  // bexio's rate limit is not documented; a short pause between calls keeps a
  // first full push of a few thousand readers well under any sane one.
  private pauseMs = 100;

  constructor(
    private prisma: PrismaClient,
    private payments: PaymentsService
  ) {}

  async syncAll(): Promise<BexioContactSyncResult[]> {
    const results: BexioContactSyncResult[] = [];

    for (const provider of this.payments.getProviders()) {
      if (!(provider instanceof BexioPaymentProvider)) {
        continue;
      }

      const config = await provider.getConfig();

      if (!config?.bexio_contactSync) {
        continue;
      }

      results.push(await this.syncProvider(provider));
    }

    return results;
  }

  private async syncProvider(
    provider: BexioPaymentProvider
  ): Promise<BexioContactSyncResult> {
    const started = new Date();
    const readers = [
      ...(await this.changedKnownReaders(provider.id)),
      ...(await this.unknownBexioReaders(provider.id)),
    ];
    let pushed = 0;
    let failed = 0;
    let firstError: string | undefined;
    let stopped: BexioContactSyncResult['stopped'];

    for (const reader of readers) {
      try {
        await provider.syncContact(reader);
        pushed++;
      } catch (error) {
        failed++;
        firstError ??= describeError(error);
        this.logger.warn(
          `Could not push reader ${reader.id} to bexio ${provider.id}: ${describeError(error)}`
        );

        // Nothing is lost: the next night starts where this one stopped.
        if (bexioStatus(error) === 429) {
          stopped = 'rate-limited';
          this.logger.error(
            `bexio ${provider.id} rate-limits the contact sync; stopping for tonight`
          );
          break;
        }

        // A rejected key fails every reader the same way.
        if (bexioStatus(error) === 401) {
          stopped = 'key-rejected';
          this.logger.error(
            `bexio ${provider.id} rejects the API key; stopping the contact sync`
          );
          break;
        }
      }

      await pause(this.pauseMs);
    }

    this.logger.log(
      `bexio ${provider.id}: ${pushed} of ${readers.length} readers pushed`
    );

    await this.prisma.settingPaymentProvider.update({
      where: { id: provider.id },
      data: {
        bexio_contactSyncAt: started,
        bexio_contactSyncError:
          stopped === 'key-rejected' ?
            `bexio rejects the API key (HTTP 401); stopped at the first of ${readers.length} readers. Enter a valid key in the integration. ${firstError}`
          : failed ?
            `${failed} of ${readers.length} readers failed: ${firstError}`
          : null,
      },
    });

    return {
      providerId: provider.id,
      readers: readers.length,
      pushed,
      failed,
      ...(stopped ? { stopped } : {}),
      ...(firstError ? { firstError } : {}),
    };
  }

  /** Readers with a stored contact whose data changed since the last push. */
  private async changedKnownReaders(
    providerId: string
  ): Promise<SyncContactUser[]> {
    const links = await this.prisma.paymentProviderCustomer.findMany({
      where: { paymentProviderID: providerId, userId: { not: null } },
      include: {
        User: { include: { address: true, paymentProviderCustomers: true } },
      },
    });

    return links
      .filter(
        ({ syncedAt, User }) =>
          User &&
          (!syncedAt ||
            syncedAt < User.modifiedAt ||
            (User.address && syncedAt < User.address.modifiedAt))
      )
      .map(({ User }) => User as SyncContactUser);
  }

  /** Readers on a bexio payment method that bexio has no contact for. */
  private unknownBexioReaders(providerId: string): Promise<SyncContactUser[]> {
    return this.prisma.user.findMany({
      where: {
        paymentProviderCustomers: { none: { paymentProviderID: providerId } },
        subscriptions: {
          some: {
            deactivation: { is: null },
            paymentMethod: { paymentProviderID: providerId },
          },
        },
      },
      include: { address: true, paymentProviderCustomers: true },
    });
  }
}

// The HTTP status of a failed bexio call: the SDK rejects with {code}, the
// provider throws ResponseNOK {status}, and the provider error wrapper puts a
// non-Error rejection under `cause`.
const bexioStatus = (error: unknown): number | undefined => {
  const { code, status, cause } =
    (error as { code?: unknown; status?: unknown; cause?: unknown } | null) ??
    {};
  const own = [code, status].find(value => typeof value === 'number');

  return (
    (own as number | undefined) ?? (cause ? bexioStatus(cause) : undefined)
  );
};

const pause = (ms: number) =>
  ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : undefined;
