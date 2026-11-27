import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  GiftCodeCancellationReason,
  InvoiceItem,
  SellableKind,
} from '@prisma/client';
import {
  SellableHandler,
  SellableInvoice,
  SellableRegistry,
  SellableRevokeReason,
} from '@wepublish/payment/api';
import { FeaturesService } from '@wepublish/features/api';
import { GiftCodeService } from './gift-code.service';
import { GiftCodeMailService } from './gift-code-mail.service';

@Injectable()
export class GiftCodeSellableHandler implements SellableHandler, OnModuleInit {
  readonly kind = SellableKind.giftCode;

  constructor(
    private registry: SellableRegistry,
    private giftCodes: GiftCodeService,
    private features: FeaturesService,
    private mails: GiftCodeMailService
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  async isAvailable() {
    return this.features.isEnabled('gift-codes');
  }

  async fulfil(item: InvoiceItem, invoice: SellableInvoice) {
    const issuedId = await this.giftCodes.issueForInvoiceItem(
      item.id,
      invoice.paidAt ?? new Date()
    );

    // Only the run that issued the code mails it, so a webhook and the
    // polling reconciling the same invoice send one mail between them.
    if (issuedId) {
      await this.mails.sendPurchaseMail(issuedId);
    }
  }

  async revoke(
    item: InvoiceItem,
    _invoice: SellableInvoice,
    reason: SellableRevokeReason
  ) {
    await this.giftCodes.cancelForInvoiceItem(
      item.id,
      reason === SellableRevokeReason.chargeback ?
        GiftCodeCancellationReason.chargeback
      : GiftCodeCancellationReason.invoiceCanceled
    );
  }

  async allowedPaymentMethodIds(item: InvoiceItem, _invoice: SellableInvoice) {
    return this.giftCodes.paymentMethodIdsForInvoiceItem(item.id);
  }
}
