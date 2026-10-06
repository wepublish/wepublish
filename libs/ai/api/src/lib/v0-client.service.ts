import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { createClient } from 'v0-sdk';

type V0Settings = { apiKey: string | null; systemPrompt: string | null };

class V0Config {
  private readonly ttl = 21600; // 6h
  private readonly crypto = new SecretCrypto();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private async loadV0(): Promise<V0Settings> {
    await this.prisma.settingAIProvider.update({
      where: { id: this.id },
      data: { lastLoadedAt: new Date() },
    });
    const config = await this.prisma.settingAIProvider.findUnique({
      where: { id: this.id },
      select: { apiKey: true, systemPrompt: true },
    });

    let decryptedApiKey: string | null = null;
    if (config?.apiKey) {
      try {
        decryptedApiKey = this.crypto.decrypt(config.apiKey);
      } catch (e) {
        console.error(e);
        throw new Error(`Failed to decrypt API key for AI setting ${this.id}`);
      }
    }

    return {
      apiKey: decryptedApiKey,
      systemPrompt: config?.systemPrompt ?? null,
    };
  }

  async getV0(): Promise<V0Settings> {
    return this.kv.getOrLoadNs<V0Settings>(
      'settings:ai',
      `${this.id}`,
      () => this.loadV0(),
      this.ttl
    );
  }

  async apiKey(): Promise<string | null> {
    return (await this.getV0()).apiKey;
  }

  async systemPrompt(): Promise<string | null> {
    return (await this.getV0()).systemPrompt;
  }
}

@Injectable()
export class V0ClientService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  async getClient() {
    const config = new V0Config(this.prisma, this.kv, 'v0');
    const apiKey = await config.apiKey();

    if (!apiKey) {
      throw new Error('V0 API key required');
    }

    return createClient({
      apiKey,
    });
  }

  async getSystemPrompt() {
    const config = new V0Config(this.prisma, this.kv, 'v0');

    return (await config.systemPrompt()) ?? '';
  }
}
