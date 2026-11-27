import { forwardRef, Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { FeaturesService } from '@wepublish/features/api';
import { MemberPlanDataloader } from '@wepublish/member-plan/api';
import { GiftCodeOfferDataloader } from '../../../../../gift-code/api/src/lib/gift-code-offer.dataloader';
import { GiftCodeOffer } from '../../../../../gift-code/api/src/lib/gift-code-offer.model';
import { GiftCodeOffersBlock } from './gift-code-offers-block.model';

@Resolver(() => GiftCodeOffersBlock)
export class GiftCodeOffersBlockResolver {
  constructor(
    private features: FeaturesService,
    private offerDataloader: GiftCodeOfferDataloader,
    @Inject(forwardRef(() => MemberPlanDataloader))
    private memberPlanDataloader: MemberPlanDataloader
  ) {}

  @ResolveField(() => [GiftCodeOffer])
  async giftCodeOffers(@Parent() parent: GiftCodeOffersBlock) {
    const ids = parent.giftCodeOfferIds ?? [];

    if (!ids.length || !(await this.features.isEnabled('gift-codes'))) {
      return [];
    }

    const offers = (await this.offerDataloader.loadMany(ids)).filter(
      offer => offer && !(offer instanceof Error) && offer.active
    ) as GiftCodeOffer[];
    const memberPlans = await this.memberPlanDataloader.loadMany(
      offers.map(offer => offer.memberPlanId)
    );

    return offers.filter((_offer, index) => {
      const memberPlan = memberPlans[index];

      return memberPlan && !(memberPlan instanceof Error) && memberPlan.active;
    });
  }

  @ResolveField(() => [String])
  async giftCodeOfferIds(@Parent() parent: GiftCodeOffersBlock) {
    const ids = parent.giftCodeOfferIds ?? [];
    const offers = await this.offerDataloader.loadMany(ids);

    return ids.filter((_id, index) => !!offers[index]);
  }
}
