import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PaymentProviderService {
  constructor(protected prisma: PrismaClient) {}

  async getAllPaymentProviders() {
    // This is the list a payment method is picked from, so a retired provider
    // must not appear — it keeps serving what already uses it, nothing new.
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
