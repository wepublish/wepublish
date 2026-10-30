import { NotFoundException } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GiftCodeOffer as PGiftCodeOffer } from '@prisma/client';
import { Feature } from '@wepublish/features/api';
import { MemberPlanDataloader } from '@wepublish/member-plan/api';
import { PaymentMethod, PaymentMethodDataloader } from '@wepublish/payment/api';
import {
  CanDeleteGiftCodes,
  CanGetGiftCodes,
  CanUpdateGiftCodes,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { GiftCodeOfferDataloader } from './gift-code-offer.dataloader';
import {
  CreateGiftCodeOfferInput,
  GiftCodeOffer,
  GiftCodeOfferListArgs,
  GiftCodePrice,
  PaginatedGiftCodeOffers,
  UpdateGiftCodeOfferInput,
} from './gift-code-offer.model';
import { GiftCodeOfferService } from './gift-code-offer.service';

@Feature('gift-codes')
@Resolver(() => GiftCodeOffer)
export class GiftCodeOfferResolver {
  constructor(
    private offerService: GiftCodeOfferService,
    private dataloader: GiftCodeOfferDataloader,
    private memberPlans: MemberPlanDataloader,
    private paymentMethodDataloader: PaymentMethodDataloader
  ) {}

  @Permissions(CanGetGiftCodes, CanUpdateGiftCodes, CanDeleteGiftCodes)
  @Query(() => PaginatedGiftCodeOffers, {
    description: 'Returns a list of gift code offers.',
  })
  public giftCodeOffers(@Args() args: GiftCodeOfferListArgs) {
    return this.offerService.getOffers(args);
  }

  @Permissions(CanGetGiftCodes, CanUpdateGiftCodes, CanDeleteGiftCodes)
  @Query(() => GiftCodeOffer, { description: 'Returns a gift code offer.' })
  public async giftCodeOffer(@Args('id') id: string) {
    const offer = await this.dataloader.load(id);

    if (!offer) {
      throw new NotFoundException(`Gift code offer ${id} was not found.`);
    }

    return offer;
  }

  @Permissions(CanUpdateGiftCodes)
  @Mutation(() => GiftCodeOffer, { description: 'Creates a gift code offer.' })
  public createGiftCodeOffer(@Args() input: CreateGiftCodeOfferInput) {
    return this.offerService.createOffer(input);
  }

  @Permissions(CanUpdateGiftCodes)
  @Mutation(() => GiftCodeOffer, { description: 'Updates a gift code offer.' })
  public updateGiftCodeOffer(@Args() input: UpdateGiftCodeOfferInput) {
    return this.offerService.updateOffer(input);
  }

  @Permissions(CanDeleteGiftCodes)
  @Mutation(() => GiftCodeOffer, {
    description: 'Deletes a gift code offer that has not sold any codes.',
  })
  public deleteGiftCodeOffer(@Args('id') id: string) {
    return this.offerService.deleteOffer(id);
  }

  @ResolveField(() => GiftCodePrice)
  public async price(@Parent() offer: PGiftCodeOffer) {
    const memberPlan = await this.memberPlans.load(offer.memberPlanId);

    if (!memberPlan) {
      throw new NotFoundException(
        `Member plan ${offer.memberPlanId} was not found.`
      );
    }

    return this.offerService.getPrice({
      periodicity: offer.periodicity,
      memberPlan,
    });
  }

  @ResolveField(() => [PaymentMethod], {
    description: 'The payment methods a buyer can use for this offer.',
  })
  public paymentMethods(@Parent() offer: PGiftCodeOffer) {
    return this.offerService.getPaymentMethods(offer.id);
  }

  @ResolveField(() => [String], {
    description: 'The payment methods configured on this offer.',
  })
  public paymentMethodIds(@Parent() offer: PGiftCodeOffer) {
    return this.offerService.getPaymentMethodIds(offer.id);
  }

  @ResolveField(() => PaymentMethod, {
    nullable: true,
    description:
      'The payment method of subscriptions that renew automatically.',
  })
  public async renewalPaymentMethod(@Parent() offer: PGiftCodeOffer) {
    if (!offer.renewalPaymentMethodId) {
      return null;
    }

    return this.paymentMethodDataloader.load(offer.renewalPaymentMethodId);
  }
}
