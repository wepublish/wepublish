import {
  LetterProviderType,
  PrismaClient,
  SettingLetterProvider,
} from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import bodyParser from 'body-parser';
import { NextHandleFunction } from 'connect';
import {
  DispatchLetterProps,
  LetterLogStatus,
  LetterProvider,
  LetterProviderMessageState,
  SendLetterProps,
  SendLetterResult,
  WebhookForSendLetterProps,
} from './letter-provider.interface';

export const LETTER_PROVIDER_SETTINGS_NAMESPACE = 'settings:letterprovider';

export interface LetterProviderProps {
  id: string;
  prisma: PrismaClient;
  kv: KvTtlCacheService;
  incomingRequestHandler?: NextHandleFunction;
}

export abstract class BaseLetterProvider implements LetterProvider {
  readonly id: string;
  readonly prisma: PrismaClient;
  readonly kv: KvTtlCacheService;
  readonly incomingRequestHandler: NextHandleFunction;

  protected constructor(props: LetterProviderProps) {
    this.id = props.id;
    this.incomingRequestHandler =
      props.incomingRequestHandler ?? bodyParser.json();
    this.prisma = props.prisma;
    this.kv = props.kv;
  }

  abstract webhookForSendLetter(
    props: WebhookForSendLetterProps
  ): Promise<LetterLogStatus[]>;
  abstract sendLetter(props: SendLetterProps): Promise<SendLetterResult>;
  abstract dispatchLetter(props: DispatchLetterProps): Promise<void>;
  abstract cancelLetter(providerLetterID: string): Promise<void>;
  abstract getLetterFile(providerLetterID: string): Promise<Buffer>;
  abstract getName(): Promise<string>;

  async getMessageStates(
    _providerLetterIDs: string[]
  ): Promise<LetterProviderMessageState[]> {
    return [];
  }

  async getConfig(): Promise<SettingLetterProvider | null> {
    return await new LetterProviderConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
  }

  public async initDatabaseConfiguration(
    type: LetterProviderType,
    defaults?: Partial<
      Omit<
        SettingLetterProvider,
        'id' | 'type' | 'createdAt' | 'modifiedAt' | 'lastLoadedAt'
      >
    >
  ): Promise<void> {
    await this.prisma.settingLetterProvider.upsert({
      where: {
        id: this.id,
      },
      create: {
        id: this.id,
        type,
        ...defaults,
      },
      update: {},
    });
    return;
  }
}

class LetterProviderConfig {
  private readonly ttl = 21600;
  private readonly crypto = new SecretCrypto();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private decrypt(value: string | null, field: string): string | null {
    if (!value) {
      return null;
    }

    try {
      return this.crypto.decrypt(value);
    } catch (e) {
      console.error(e);
      throw new Error(
        `Failed to decrypt ${field} for Letter provider setting ${this.id}`
      );
    }
  }

  private async load(): Promise<SettingLetterProvider | null> {
    const config = await this.prisma.settingLetterProvider.findUnique({
      where: {
        id: this.id,
      },
    });

    // A provider that was never configured is a normal state, not an error:
    // the fake provider used in development never writes a settings row.
    if (!config) {
      return null;
    }

    await this.prisma.settingLetterProvider.update({
      where: { id: this.id },
      data: { lastLoadedAt: new Date() },
    });

    return {
      ...config,
      clientSecret: this.decrypt(config.clientSecret, 'clientSecret'),
      webhookSigningKey: this.decrypt(
        config.webhookSigningKey,
        'webhookSigningKey'
      ),
    };
  }

  async getConfig(): Promise<SettingLetterProvider | null> {
    return this.kv.getOrLoadNs<SettingLetterProvider | null>(
      LETTER_PROVIDER_SETTINGS_NAMESPACE,
      `${this.id}`,
      () => this.load(),
      this.ttl
    );
  }
}
