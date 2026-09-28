import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  ChallengeProvider,
  loadChallengeProvider,
} from '@wepublish/challenge/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { BaseMailProvider, loadMailProvider } from '@wepublish/mail/api';
import { PaymentProvider, loadPaymentProviders } from '@wepublish/payment/api';
import {
  TrackingPixelProvider,
  loadTrackingPixelProviders,
} from '@wepublish/tracking-pixel/api';
import { ProviderSettingsChangedListener } from '@wepublish/settings/api';
import { createSwappableProvider } from './swappable-provider';

/**
 * Runs once before the providers are first loaded. The API example uses it to
 * migrate a deployment's YAML registry into the database; the lib itself stays
 * free of any notion of a config file.
 */
export const PROVIDER_REGISTRY_BOOTSTRAP = 'PROVIDER_REGISTRY_BOOTSTRAP';

export type ProviderRegistryBootstrap = () => Promise<void>;

/**
 * Owns the set of configured providers.
 *
 * The provider tables are the registry — a row is a configured provider and
 * `enabled` decides whether it is instantiated. Because that set can change
 * while the process runs, nothing outside this service may hold an instance:
 * lists are mutated in place and singletons are handed out as swappable
 * proxies, so `reload()` reaches every consumer without a restart.
 */
@Injectable()
export class ProviderRegistryService
  implements ProviderSettingsChangedListener
{
  private readonly logger = new Logger(ProviderRegistryService.name);

  readonly paymentProviders: PaymentProvider[] = [];
  readonly trackingPixelProviders: TrackingPixelProvider[] = [];

  private currentMailProvider: BaseMailProvider | null = null;
  private currentChallengeProvider: ChallengeProvider | null = null;

  readonly mailProvider = createSwappableProvider<BaseMailProvider>(
    'mail provider',
    () => this.currentMailProvider
  );

  readonly challengeProvider = createSwappableProvider<ChallengeProvider>(
    'challenge provider',
    () => this.currentChallengeProvider
  );

  private loaded: Promise<void> | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly httpClient: HttpService,
    @Optional()
    @Inject(PROVIDER_REGISTRY_BOOTSTRAP)
    private readonly bootstrap?: ProviderRegistryBootstrap
  ) {}

  /**
   * Every module that consumes providers calls this from its factory, so the
   * first one to be constructed does the loading and the rest await it.
   */
  ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.loaded = (async () => {
        await this.bootstrap?.();
        await this.reload();
      })();
    }

    return this.loaded;
  }

  /** Saving an integration is a request to put it into service. */
  onProviderSettingsChanged(): Promise<void> {
    return this.reload();
  }

  async reload(): Promise<void> {
    const deps = { prisma: this.prisma, kv: this.kv };

    const [payment, trackingPixel, mail, challenge] = await Promise.all([
      loadPaymentProviders(deps),
      loadTrackingPixelProviders({ ...deps, httpClient: this.httpClient }),
      loadMailProvider(deps),
      loadChallengeProvider(deps),
    ]);

    // splice rather than reassign: consumers captured this array at boot.
    this.paymentProviders.splice(0, this.paymentProviders.length, ...payment);
    this.trackingPixelProviders.splice(
      0,
      this.trackingPixelProviders.length,
      ...trackingPixel
    );

    this.currentMailProvider = mail;
    this.currentChallengeProvider = challenge;

    // The class, not just the id: switching a singleton's type keeps the row
    // and only swaps the implementation, so the id alone would not show it.
    const describe = (provider: object | null) =>
      provider ? provider.constructor.name : 'none';

    // The ids, not just a count: this log is what an operator reads to check
    // that a change to the integrations actually took.
    const ids = (providers: { id: string }[]) =>
      providers.length ? providers.map(({ id }) => id).join(', ') : 'none';

    this.logger.log(
      `Loaded providers — payment: ${ids(payment)} | tracking pixel: ${ids(trackingPixel)} | ` +
        `mail: ${mail ? `${mail.id} (${describe(mail)})` : 'none'} | ` +
        `challenge: ${describe(challenge)}`
    );
  }
}
