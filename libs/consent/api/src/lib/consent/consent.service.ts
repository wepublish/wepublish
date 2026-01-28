import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  Consent,
  ConsentFilter,
  CreateConsentInput,
  UpdateConsentInput,
} from './consent.model';

@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaClient) {}

  async consentList(filter?: ConsentFilter): Promise<Consent[]> {
    const data = await this.prisma.consent.findMany({
      where: {
        ...filter,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data;
  }

  async consent(id: string): Promise<Consent> {
    const data = await this.prisma.consent.findUnique({
      where: {
        id,
      },
    });

    if (!data) {
      throw new NotFoundException(`Consent with id ${id} not found`);
    }

    return data;
  }

  async createConsent(consent: CreateConsentInput): Promise<Consent> {
    return await this.prisma.consent.create({ data: consent });
  }

  async updateConsent({
    id,
    ...consent
  }: UpdateConsentInput): Promise<Consent> {
    const updated = await this.prisma.consent.update({
      where: { id },
      data: {
        ...consent,
      },
    });

    return updated;
  }

  async deleteConsent(id: string) {
    const deleted = this.prisma.consent.delete({
      where: { id },
    });
    return deleted;
  }
}
