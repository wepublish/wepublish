import { ForbiddenException } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  type AuthSession,
  Authenticated,
  CurrentUser,
} from '@wepublish/authentication/api';
import { Feature } from '@wepublish/features/api';
import { Invoice } from '@wepublish/membership/api';
import { GiftCodeInvoiceService } from './gift-code-invoice.service';
import { PayInvoiceWithGiftCodeInput } from './gift-code.model';

@Resolver()
export class GiftCodeInvoiceResolver {
  constructor(private giftCodeInvoices: GiftCodeInvoiceService) {}

  @Feature('gift-codes')
  @Authenticated()
  @Mutation(() => Invoice, {
    description:
      'Pays an open invoice of one of your subscriptions with a gift code for the same member plan and payment periodicity.',
  })
  public payInvoiceWithGiftCode(
    @Args() input: PayInvoiceWithGiftCodeInput,
    @CurrentUser() session: AuthSession
  ) {
    if (!session || !('user' in session) || !session.user) {
      throw new ForbiddenException('Only users can do this.');
    }

    return this.giftCodeInvoices.payInvoice(session.user.id, input);
  }
}
