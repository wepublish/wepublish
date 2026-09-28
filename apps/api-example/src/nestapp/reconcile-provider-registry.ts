import {
  PaymentProviderType,
  PrismaClient,
  SyncProviderType,
  TrackingPixelProviderType,
} from '@prisma/client';
import { Logger } from '@nestjs/common';
import { SettingName } from '@wepublish/settings/api';
import { readConfig } from '../readConfig';

export const PROVIDER_REGISTRY_RECONCILED = 'providerRegistryReconciled';

const PAYMENT_TYPES: Record<string, PaymentProviderType> = {
  payrexx: PaymentProviderType.PAYREXX,
  'payrexx-subscription': PaymentProviderType.PAYREXX_SUBSCRIPTION,
  stripe: PaymentProviderType.STRIPE,
  'stripe-checkout': PaymentProviderType.STRIPE_CHECKOUT,
  mollie: PaymentProviderType.MOLLIE,
  bexio: PaymentProviderType.BEXIO,
  'no-charge': PaymentProviderType.NO_CHARGE,
};

const TRACKING_PIXEL_TYPES: Record<string, TrackingPixelProviderType> = {
  prolitteris: TrackingPixelProviderType.prolitteris,
};

const SYNC_TYPES: Record<string, SyncProviderType> = {
  mailchimp: SyncProviderType.MAILCHIMP,
};

/**
 * Hands the provider registry over from the config file to the database, once.
 *
 * Until now the YAML decided which providers existed and the tables were only
 * a side effect of that — which means a provider dropped from the YAML left its
 * row behind. Reading the tables from now on would put those back on offer, so
 * the first boot after the upgrade marks whatever the YAML no longer lists as
 * deleted and records that it has done so. They keep running, as deleted
 * providers do; they are simply no longer offered.
 *
 * Once every environment has booted once, the registry blocks can be deleted
 * from the config files and this can go with them.
 */
export const reconcileProviderRegistry = async (
  prisma: PrismaClient,
  configFilePath: string | undefined
): Promise<void> => {
  const logger = new Logger('ProviderRegistryReconcile');

  const done = await prisma.setting.findUnique({
    where: { name: PROVIDER_REGISTRY_RECONCILED },
  });

  if (done) {
    return;
  }

  if (!configFilePath) {
    await markReconciled(prisma);
    return;
  }

  let configFile: Awaited<ReturnType<typeof readConfig>>;

  try {
    configFile = await readConfig(configFilePath);
  } catch (error) {
    logger.warn(
      `Could not read ${configFilePath}, keeping the provider settings as they are: ${error}`
    );
    await markReconciled(prisma);
    return;
  }

  const paymentIds = (configFile.paymentProviders ?? [])
    .map(provider => provider.id)
    .filter(Boolean);
  const trackingPixelIds = (configFile.trackingPixelProviders ?? [])
    .map(provider => provider.id)
    .filter(Boolean);

  // An empty section means the deployment never configured that kind of
  // provider, not that it wants every one of them retired.
  if (paymentIds.length) {
    const { count } = await prisma.settingPaymentProvider.updateMany({
      where: { id: { notIn: paymentIds }, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (count) {
      logger.log(`Retired ${count} payment provider(s) absent from the config`);
    }

    await Promise.all(
      (configFile.paymentProviders ?? []).map(provider =>
        upsertProvider(
          prisma,
          'settingPaymentProvider',
          provider.id,
          PAYMENT_TYPES[provider.type]
        )
      )
    );
  }

  if (trackingPixelIds.length) {
    const { count } = await prisma.settingTrackingPixel.updateMany({
      where: { id: { notIn: trackingPixelIds }, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (count) {
      logger.log(
        `Retired ${count} tracking pixel provider(s) absent from the config`
      );
    }

    await Promise.all(
      (configFile.trackingPixelProviders ?? []).map(provider =>
        upsertProvider(
          prisma,
          'settingTrackingPixel',
          provider.id,
          TRACKING_PIXEL_TYPES[provider.type]
        )
      )
    );
  }

  // The session lifetime moves the same way: whatever the config file said is
  // what the installation keeps, rather than silently dropping to the default.
  const sessionTTLDays = configFile.general?.sessionTTLDays;

  if (typeof sessionTTLDays === 'number' && sessionTTLDays > 0) {
    await prisma.setting.upsert({
      where: { name: SettingName.SESSION_TTL_DAYS },
      create: {
        name: SettingName.SESSION_TTL_DAYS,
        value: sessionTTLDays,
        settingRestriction: { minValue: 1, maxValue: 365 },
      },
      update: { value: sessionTTLDays },
    });

    logger.log(`Took the session lifetime of ${sessionTTLDays} day(s) over`);
  }

  // Sync providers were never instantiated from the YAML, only seeded from it.
  for (const provider of configFile.syncProviders ?? []) {
    await upsertProvider(
      prisma,
      'settingSyncProvider',
      provider.id,
      SYNC_TYPES[provider.type]
    );
  }

  await markReconciled(prisma);
  logger.log('Provider registry now lives in the database');
};

type ProviderDelegate = {
  upsert: (args: {
    where: { id: string };
    create: { id: string; name: string; type: string };
    update: Record<string, never>;
  }) => Promise<unknown>;
};

const upsertProvider = async (
  prisma: PrismaClient,
  delegate:
    | 'settingPaymentProvider'
    | 'settingTrackingPixel'
    | 'settingSyncProvider',
  id: string,
  type: PaymentProviderType | TrackingPixelProviderType | SyncProviderType
): Promise<void> => {
  if (!id || !type) {
    return;
  }

  // The three delegates take different enums for `type`, so they only line up
  // behind a shape that says what this function actually uses.
  await (prisma[delegate] as unknown as ProviderDelegate).upsert({
    where: { id },
    create: { id, name: id, type },
    update: {},
  });
};

const markReconciled = (prisma: PrismaClient) =>
  prisma.setting.upsert({
    where: { name: PROVIDER_REGISTRY_RECONCILED },
    create: { name: PROVIDER_REGISTRY_RECONCILED, value: true },
    update: {},
  });
