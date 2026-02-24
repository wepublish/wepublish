import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  PaymentProviderCustomer,
  SensitiveDataUser,
  UserAddress,
} from './user.model';
import { PrismaClient } from '@prisma/client';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { UserRoleDataloader } from './user-role.dataloader';
import { UserRole } from './user-role.model';
import { User as PUser } from '@prisma/client';

@Resolver(() => SensitiveDataUser)
export class SensitiveDataUserResolver {
  constructor(
    private prisma: PrismaClient,
    private userRoleDataloader: UserRoleDataloader
  ) {}

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

  @ResolveField(() => [UserRole])
  public roles(@Parent() user: PUser) {
    return this.userRoleDataloader.loadMany(user.roleIDs);
  }
}
