import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import {
  ChallengeProvider,
  loadChallengeProvider,
} from '@wepublish/challenge/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  BaseLetterProvider,
  BasePdfRenderer,
  loadLetterProvider,
  loadPdfRenderer,
} from '@wepublish/letter/api';
import { BaseMailProvider, loadMailProvider } from '@wepublish/mail/api';
import { PaymentProvider, loadPaymentProviders } from '@wepublish/payment/api';
import {
  TrackingPixelProvider,
  loadTrackingPixelProviders,
} from '@wepublish/tracking-pixel/api';
import { ProviderSettingsChangedListener } from '@wepublish/settings/api';
import { createSwappableProvider } from './swappable-provider';
import { withProviderErrorContext } from './provider-error-context';

export const PROVIDER_REGISTRY_BOOTSTRAP = 'PROVIDER_REGISTRY_BOOTSTRAP';

export type ProviderRegistryBootstrap = () => Promise<void>;

const PROVIDER_SETTINGS_NAMESPACES = [
  'settings:paymentprovider',
  'settings:tracking-pixel',
  'settings:mailprovider',
  'settings:challenge',
  'settings:letterprovider',
  'settings:pdfrenderer',
];
const RELOAD_CHECK_MS = 5000;

@Injectable()
export class ProviderRegistryService
  implements ProviderSettingsChangedListener
{
  private readonly logger = new Logger(ProviderRegistryService.name);

  readonly paymentProviders: PaymentProvider[] = [];
  readonly trackingPixelProviders: TrackingPixelProvider[] = [];

  private currentMailProvider: BaseMailProvider | null = null;
  private currentChallengeProvider: ChallengeProvider | null = null;
  private currentLetterProvider: BaseLetterProvider | null = null;
  private currentPdfRenderer: BasePdfRenderer | null = null;

  readonly mailProvider = createSwappableProvider<BaseMailProvider>(
    'mail provider',
    () => this.currentMailProvider
  );

  readonly challengeProvider = createSwappableProvider<ChallengeProvider>(
    'challenge provider',
    () => this.currentChallengeProvider
  );

  readonly letterProvider = createSwappableProvider<BaseLetterProvider>(
    'letter provider',
    () => this.currentLetterProvider
  );

  readonly pdfRenderer = createSwappableProvider<BasePdfRenderer>(
    'pdf renderer',
    () => this.currentPdfRenderer
  );

  private loaded: Promise<void> | null = null;
  private loadedVersions?: string;
  private reloading = false;
  private runningReload: Promise<void> | null = null;
  private nextReload: Promise<void> | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly httpClient: HttpService,
    @Optional()
    @Inject(PROVIDER_REGISTRY_BOOTSTRAP)
    private readonly bootstrap?: ProviderRegistryBootstrap
  ) {}

  ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.loaded = (async () => {
        await this.bootstrap?.();
        await this.reload();
      })();
    }

    return this.loaded;
  }

  onProviderSettingsChanged(): Promise<void> {
    return this.reload();
  }

  @Interval(RELOAD_CHECK_MS)
  async reloadWhenChanged(): Promise<void> {
    if (!this.loaded || this.reloading) {
      return;
    }

    this.reloading = true;

    try {
      await this.loaded;

      if ((await this.providerSettingsVersions()) !== this.loadedVersions) {
        await this.reload();
      }
    } catch (error) {
      this.logger.error(
        `Could not rebuild the providers after another replica changed them: ${error}`
      );
    } finally {
      this.reloading = false;
    }
  }

  reload(): Promise<void> {
    if (this.nextReload) {
      return this.nextReload;
    }

    if (this.runningReload) {
      const next = this.runningReload
        .catch(() => undefined)
        .then(() => {
          this.nextReload = null;

          return this.startReload();
        });
      this.nextReload = next;

      return next;
    }

    return this.startReload();
  }

  private startReload(): Promise<void> {
    const running = this.loadProviders().finally(() => {
      if (this.runningReload === running) {
        this.runningReload = null;
      }
    });
    this.runningReload = running;

    return running;
  }

  private async loadProviders(): Promise<void> {
    const versions = await this.providerSettingsVersions();
    const deps = { prisma: this.prisma, kv: this.kv };

    const [payment, trackingPixel, mail, challenge, letter, pdfRenderer] =
      await Promise.all([
        loadPaymentProviders(deps).then(providers =>
          providers.map(provider =>
            withProviderErrorContext('Payment provider', provider)
          )
        ),
        loadTrackingPixelProviders({
          ...deps,
          httpClient: this.httpClient,
        }).then(providers =>
          providers.map(provider =>
            withProviderErrorContext('Tracking pixel provider', provider)
          )
        ),
        loadMailProvider(deps).then(
          provider =>
            provider && withProviderErrorContext('Mail provider', provider)
        ),
        loadChallengeProvider(deps).then(
          provider =>
            provider && withProviderErrorContext('Challenge provider', provider)
        ),
        loadLetterProvider(deps).then(
          provider =>
            provider && withProviderErrorContext('Letter provider', provider)
        ),
        loadPdfRenderer(deps).then(
          renderer =>
            renderer && withProviderErrorContext('Pdf renderer', renderer)
        ),
      ]);

    this.paymentProviders.splice(0, this.paymentProviders.length, ...payment);
    this.trackingPixelProviders.splice(
      0,
      this.trackingPixelProviders.length,
      ...trackingPixel
    );

    this.currentMailProvider = mail;
    this.currentChallengeProvider = challenge;
    this.currentLetterProvider = letter;
    this.currentPdfRenderer = pdfRenderer;
    this.loadedVersions = versions;

    const describe = (provider: object | null) =>
      provider ? provider.constructor.name : 'none';

    const ids = (providers: { id: string }[]) =>
      providers.length ? providers.map(({ id }) => id).join(', ') : 'none';

    this.logger.log(
      `Loaded providers — payment: ${ids(payment)} | tracking pixel: ${ids(trackingPixel)} | ` +
        `mail: ${mail ? `${mail.id} (${describe(mail)})` : 'none'} | ` +
        `challenge: ${describe(challenge)} | ` +
        `letter: ${letter ? `${letter.id} (${describe(letter)})` : 'none'} | ` +
        `pdf renderer: ${pdfRenderer ? `${pdfRenderer.id} (${describe(pdfRenderer)})` : 'none'}`
    );
  }

  private async providerSettingsVersions(): Promise<string> {
    return JSON.stringify(
      await this.kv.getNamespaceVersions(PROVIDER_SETTINGS_NAMESPACES)
    );
  }
}
