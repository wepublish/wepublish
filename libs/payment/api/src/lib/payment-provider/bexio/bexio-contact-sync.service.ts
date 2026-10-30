import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { describeError } from '@wepublish/utils/api';
import { PaymentsService } from '../../payments.service';
import {
  BexioPaymentProvider,
  SyncContactUser,
} from './bexio-payment-provider';

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

  async syncAll(): Promise<void> {
    for (const provider of this.payments.getProviders()) {
      if (!(provider instanceof BexioPaymentProvider)) {
        continue;
      }

      const config = await provider.getConfig();

      if (!config?.bexio_contactSync) {
        continue;
      }

      await this.syncProvider(provider);
    }
  }

  private async syncProvider(provider: BexioPaymentProvider) {
    const started = new Date();
    const readers = [
      ...(await this.changedKnownReaders(provider.id)),
      ...(await this.unknownBexioReaders(provider.id)),
    ];
    let failed = 0;
    let firstError: string | undefined;

    for (const reader of readers) {
      try {
        await provider.syncContact(reader);
      } catch (error) {
        failed++;
        firstError ??= describeError(error);
        this.logger.warn(
          `Could not push reader ${reader.id} to bexio ${provider.id}: ${describeError(error)}`
        );

        // Nothing is lost: the next night starts where this one stopped.
        if (isRateLimited(error)) {
          this.logger.error(
            `bexio ${provider.id} rate-limits the contact sync; stopping for tonight`
          );
          break;
        }
      }

      await pause(this.pauseMs);
    }

    this.logger.log(
      `bexio ${provider.id}: ${readers.length - failed} of ${readers.length} readers pushed`
    );

    await this.prisma.settingPaymentProvider.update({
      where: { id: provider.id },
      data: {
        bexio_contactSyncAt: started,
        bexio_contactSyncError:
          failed ?
            `${failed} of ${readers.length} readers failed: ${firstError}`
          : null,
      },
    });
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

const isRateLimited = (error: unknown) =>
  (error as { code?: number } | null)?.code === 429;

const pause = (ms: number) =>
  ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : undefined;
