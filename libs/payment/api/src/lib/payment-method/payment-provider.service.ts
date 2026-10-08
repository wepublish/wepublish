import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PaymentProviderService {
  constructor(protected prisma: PrismaClient) {}

  async getAllPaymentProviders() {
    return this.prisma.settingPaymentProvider.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
      },
    });
  }
}
