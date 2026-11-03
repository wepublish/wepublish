import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  PaymentProviderCustomer,
  SensitiveDataUser,
  UserAddress,
  UserSubscriptionOverview,
} from './user.model';
import { PrismaClient } from '@prisma/client';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { UserRoleDataloader } from './user-role.dataloader';
import { UserRole } from './user-role.model';
import { User as PUser } from '@prisma/client';
import { UserSubscriptionCountDataloader } from './user-subscription-count.dataloader';
import { UserSubscriptionOverviewDataloader } from './user-subscription-overview.dataloader';
import { ReferralCodeService } from './referral/referral-code.service';

@Resolver(() => SensitiveDataUser)
export class SensitiveDataUserResolver {
  constructor(
    private prisma: PrismaClient,
    private userRoleDataloader: UserRoleDataloader,
    private subscriptionCountDataloader: UserSubscriptionCountDataloader,
    private subscriptionOverviewDataloader: UserSubscriptionOverviewDataloader,
    private referralCodeService: ReferralCodeService
  ) {}

  @ResolveField(() => UserAddress, { nullable: true })
  public async address(@Parent() { id, address }: SensitiveDataUser) {
    if (address) {
      return address;
    }

    return this.prisma.userAddress.findUnique({
      where: { userId: id },
    });
  }

  @ResolveField(() => [PaymentProviderCustomer])
  public async paymentProviderCustomers(
    @Parent() { id, paymentProviderCustomers }: SensitiveDataUser
  ) {
    if (paymentProviderCustomers !== undefined) {
      return paymentProviderCustomers;
    }

    return this.prisma.paymentProviderCustomer.findMany({
      where: { userId: id },
    });
  }

  @ResolveField(() => [String])
  public async permissions(
    @CurrentUser() user: UserSession | undefined,
    @Parent() { id }: SensitiveDataUser
  ) {
    if (user?.user.id === id) {
      return user.roles.flatMap(r => r.permissionIDs);
    }

    return [];
  }

  @ResolveField(() => String, {
    nullable: true,
    description:
      'The code for the referral link of the current user, created on first use. Null for other users.',
  })
  public async referralCode(
    @CurrentUser() user: UserSession | undefined,
    @Parent() { id }: SensitiveDataUser
  ) {
    if (user?.user.id !== id) {
      return null;
    }

    return this.referralCodeService.getReferralCode(id);
  }

  @ResolveField(() => [UserRole])
  async roles(@Parent() user: PUser) {
    return (await this.userRoleDataloader.loadMany(user.roleIDs)).filter(
      Boolean
    );
  }

  @ResolveField(() => Int)
  public async subscriptionCount(@Parent() { id }: SensitiveDataUser) {
    return await this.subscriptionCountDataloader.load(id);
  }

  @ResolveField(() => [UserSubscriptionOverview])
  public async subscriptionOverview(@Parent() { id }: SensitiveDataUser) {
    return await this.subscriptionOverviewDataloader.load(id);
  }
}
