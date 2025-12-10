import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  PaymentProviderCustomer,
  SensitiveDataUser,
  UserAddress,
} from './user.model';
import { PrismaClient } from '@prisma/client';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';

@Resolver(() => SensitiveDataUser)
export class SensitiveDataUserResolver {
  constructor(private prisma: PrismaClient) {}

  @ResolveField(() => UserAddress, { nullable: true })
  public async address(@Parent() { id, address }: SensitiveDataUser) {
    if (address !== undefined) {
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
}
