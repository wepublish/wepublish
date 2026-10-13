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

const DEFAULT_CHALLENGE_PROVIDER_ID = 'default-turnstile';

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
        ensureProvider(
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
        ensureProvider(
          prisma,
          'settingTrackingPixel',
          provider.id,
          TRACKING_PIXEL_TYPES[provider.type]
        )
      )
    );
  }

  await retireAllBut(
    prisma,
    'settingMailProvider',
    configFile.mailProvider?.id,
    logger
  );

  await retireAllBut(
    prisma,
    'settingChallengeProvider',
    configFile.challenge?.id ?? DEFAULT_CHALLENGE_PROVIDER_ID,
    logger
  );

  const sessionTTLDays = configFile.general?.sessionTTLDays;

  if (typeof sessionTTLDays === 'number' && sessionTTLDays > 0) {
    await prisma.setting.createMany({
      data: [
        {
          name: SettingName.SESSION_TTL_DAYS,
          value: sessionTTLDays,
          settingRestriction: { minValue: 1, maxValue: 365 },
        },
      ],
      skipDuplicates: true,
    });
    await prisma.setting.update({
      where: { name: SettingName.SESSION_TTL_DAYS },
      data: { value: sessionTTLDays },
    });

    logger.log(`Took the session lifetime of ${sessionTTLDays} day(s) over`);
  }

  for (const provider of configFile.syncProviders ?? []) {
    await ensureProvider(
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
  createMany: (args: {
    data: { id: string; name: string; type: string }[];
    skipDuplicates: boolean;
  }) => Promise<unknown>;
};

const ensureProvider = async (
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

  await (prisma[delegate] as unknown as ProviderDelegate).createMany({
    data: [{ id, name: id, type }],
    skipDuplicates: true,
  });
};

type SingleProviderDelegate = {
  findUnique: (args: { where: { id: string } }) => Promise<unknown>;
  updateMany: (args: {
    where: { id: { not: string }; deletedAt: null };
    data: { deletedAt: Date };
  }) => Promise<{ count: number }>;
};

const retireAllBut = async (
  prisma: PrismaClient,
  delegate: 'settingMailProvider' | 'settingChallengeProvider',
  id: string | undefined,
  logger: Logger
): Promise<void> => {
  const providers = prisma[delegate] as unknown as SingleProviderDelegate;

  if (!id || !(await providers.findUnique({ where: { id } }))) {
    return;
  }

  const { count } = await providers.updateMany({
    where: { id: { not: id }, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (count) {
    logger.log(`Retired ${count} ${delegate} row(s), keeping ${id} active`);
  }
};

const markReconciled = (prisma: PrismaClient) =>
  prisma.setting.createMany({
    data: [{ name: PROVIDER_REGISTRY_RECONCILED, value: true }],
    skipDuplicates: true,
  });
