import { ForbiddenException } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  type AuthSession,
  Authenticated,
  CurrentUser,
} from '@wepublish/authentication/api';
import { Feature } from '@wepublish/features/api';
import {
  GiftCodeRedemption,
  RedeemGiftCodeArgs,
} from './gift-code-redemption.model';
import { GiftCodeRedemptionService } from './gift-code-redemption.service';

@Resolver()
export class GiftCodeRedemptionResolver {
  constructor(private redemptions: GiftCodeRedemptionService) {}

  @Feature('gift-codes')
  @Authenticated()
  @Mutation(() => GiftCodeRedemption, {
    description:
      'Redeems a gift code for your own subscriptions. It pays the open invoice of a subscription with the same member plan and payment periodicity, pays the next period of such a subscription, or starts a new subscription.',
  })
  public redeemGiftCode(
    @Args() { code }: RedeemGiftCodeArgs,
    @CurrentUser() session: AuthSession
  ) {
    if (!session || !('user' in session) || !session.user) {
      throw new ForbiddenException('Only users can do this.');
    }

    return this.redemptions.redeem(session.user.id, code);
  }
}
