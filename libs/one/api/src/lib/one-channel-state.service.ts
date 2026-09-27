import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const SINGLETON_ID = 'singleton';

export interface OneChannelStateSnapshot {
  lastSuccessAt: Date | null;
  lastAttemptAt: Date | null;
  lastError: string | null;
}

@Injectable()
export class OneChannelStateService {
  private lastAttemptAt: Date | null = null;
  private lastError: string | null = null;

  constructor(private prisma: PrismaClient) {}

  async recordSuccess(at: Date): Promise<void> {
    this.lastAttemptAt = at;
    this.lastError = null;

    await this.prisma.oneChannelState.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, lastSuccessAt: at },
      update: { lastSuccessAt: at },
    });
  }

  recordFailure(at: Date, error: string): void {
    this.lastAttemptAt = at;
    this.lastError = error;
  }

  async getState(): Promise<OneChannelStateSnapshot> {
    const row = await this.prisma.oneChannelState.findUnique({
      where: { id: SINGLETON_ID },
    });

    return {
      lastSuccessAt: row?.lastSuccessAt ?? null,
      lastAttemptAt: this.lastAttemptAt,
      lastError: this.lastError,
    };
  }
}
