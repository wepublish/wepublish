import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Currency, GiftCode as PGiftCode } from '@prisma/client';
import {
  type AuthSession,
  Authenticated,
  CurrentUser,
} from '@wepublish/authentication/api';
import { Feature, FeaturesService } from '@wepublish/features/api';
import { Payment } from '@wepublish/payment/api';
import { CanGetGiftCodes, CanUpdateGiftCodes } from '@wepublish/permissions';
import {
  hasPermission,
  permissionsOf,
  Permissions,
} from '@wepublish/permissions/api';
// eslint-disable-next-line no-restricted-imports
import { SensitiveDataUser, UserDataloaderService } from '@wepublish/user/api';
import { formatGiftCode } from './gift-code-generator';
import { GiftCodeOffer } from './gift-code-offer.model';
import { GiftCodeOfferDataloader } from './gift-code-offer.dataloader';
import { GiftCodePurchaseDataloader } from './gift-code-purchase.dataloader';
import { deriveGiftCodeStatus, GiftCodeStatus } from './gift-code-status';
import {
  GiftCode,
  GiftCodeListArgs,
  PaginatedGiftCodes,
  PayGiftCodeInput,
  PurchaseGiftCodeInput,
} from './gift-code.model';
import { GiftCodeService } from './gift-code.service';

type Caller = AuthSession | null | undefined;

const userIdOf = (session: Caller) =>
  session && 'user' in session ? session.user?.id : undefined;

const isGiftCodeAdmin = (session: Caller) =>
  hasPermission(CanGetGiftCodes, permissionsOf(session));

const sessionUser = (session: Caller) => {
  if (!session || !('user' in session) || !session.user) {
    throw new ForbiddenException('Only users can do this.');
  }

  return session.user;
};

@Resolver(() => GiftCode)
export class GiftCodeResolver {
  constructor(
    private giftCodeService: GiftCodeService,
    private offers: GiftCodeOfferDataloader,
    private purchases: GiftCodePurchaseDataloader,
    private users: UserDataloaderService,
    private features: FeaturesService
  ) {}

  @Feature('gift-codes')
  @Permissions(CanGetGiftCodes)
  @Query(() => PaginatedGiftCodes, {
    description: 'Returns a list of gift codes.',
  })
  public giftCodes(@Args() args: GiftCodeListArgs) {
    return this.giftCodeService.getGiftCodes(args);
  }

  @Feature('gift-codes')
  @Permissions(CanGetGiftCodes)
  @Query(() => GiftCode, { description: 'Returns a gift code.' })
  public async giftCode(@Args('id') id: string) {
    const giftCode = await this.giftCodeService.getGiftCode(id);

    if (!giftCode) {
      throw new NotFoundException(`Gift code ${id} was not found.`);
    }

    return giftCode;
  }

  @Authenticated()
  @Query(() => [GiftCode], {
    description: 'Returns the gift codes the current user bought.',
  })
  public async myGiftCodes(@CurrentUser() session: AuthSession) {
    const { id } = sessionUser(session);

    if (!(await this.features.isEnabled('gift-codes'))) {
      return [];
    }

    return this.giftCodeService.getMyGiftCodes(id);
  }

  @Feature('gift-codes')
  @Authenticated()
  @Mutation(() => Payment, {
    description: 'Buys a gift code and starts its payment.',
  })
  public purchaseGiftCode(
    @Args() input: PurchaseGiftCodeInput,
    @CurrentUser() session: AuthSession
  ) {
    const { id, email } = sessionUser(session);

    return this.giftCodeService.purchase({ id, email }, input);
  }

  @Feature('gift-codes')
  @Authenticated()
  @Mutation(() => Payment, {
    description: 'Starts a new payment for an unpaid gift code.',
  })
  public payGiftCode(
    @Args() input: PayGiftCodeInput,
    @CurrentUser() session: AuthSession
  ) {
    return this.giftCodeService.pay(sessionUser(session).id, input);
  }

  @Feature('gift-codes')
  @Permissions(CanUpdateGiftCodes)
  @Mutation(() => GiftCode, {
    description:
      'Cancels a gift code. Refunds of paid codes happen outside We.Publish.',
  })
  public cancelGiftCode(
    @Args('id') id: string,
    @CurrentUser() session: AuthSession
  ) {
    return this.giftCodeService.cancel(id, sessionUser(session).id);
  }

  @ResolveField(() => String, {
    nullable: true,
    description:
      'Only visible to admins and to the buyer of an issued, uncanceled code.',
  })
  public code(@Parent() giftCode: PGiftCode, @CurrentUser() session: Caller) {
    if (isGiftCodeAdmin(session)) {
      return formatGiftCode(giftCode.code);
    }

    const userId = userIdOf(session);
    const isBuyer = !!userId && userId === giftCode.buyerId;

    if (isBuyer && giftCode.issuedAt && !giftCode.canceledAt) {
      return formatGiftCode(giftCode.code);
    }

    return null;
  }

  @ResolveField(() => SensitiveDataUser, {
    nullable: true,
    description: 'Only visible to admins.',
  })
  public async buyer(
    @Parent() giftCode: PGiftCode,
    @CurrentUser() session: Caller
  ) {
    if (!isGiftCodeAdmin(session) || !giftCode.buyerId) {
      return null;
    }

    return this.users.load(giftCode.buyerId);
  }

  @ResolveField(() => GiftCodeStatus)
  public status(@Parent() giftCode: PGiftCode) {
    return deriveGiftCodeStatus(giftCode);
  }

  @ResolveField(() => GiftCodeOffer)
  public offer(@Parent() giftCode: PGiftCode) {
    return this.offers.load(giftCode.offerId);
  }

  @ResolveField(() => Int)
  public async amount(@Parent() giftCode: PGiftCode) {
    const purchase = await this.purchases.load(giftCode.invoiceItemId);

    return purchase ? purchase.amount * purchase.quantity : 0;
  }

  @ResolveField(() => Currency, { nullable: true })
  public async currency(@Parent() giftCode: PGiftCode) {
    const purchase = await this.purchases.load(giftCode.invoiceItemId);

    return purchase?.invoices?.currency ?? null;
  }

  @ResolveField(() => String, { nullable: true })
  public async invoiceId(@Parent() giftCode: PGiftCode) {
    const purchase = await this.purchases.load(giftCode.invoiceItemId);

    return purchase?.invoiceId ?? null;
  }

  @ResolveField(() => Boolean, {
    description: 'Whether the invoice of the purchase is paid.',
  })
  public async paid(@Parent() giftCode: PGiftCode) {
    const purchase = await this.purchases.load(giftCode.invoiceItemId);

    return !!purchase?.invoices?.paidAt;
  }
}
