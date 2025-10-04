import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaymentProviderCustomer, User, UserAddress } from './user.model';
import { PrismaClient } from '@prisma/client';
import { Property } from '@wepublish/utils/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private prisma: PrismaClient,
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @ResolveField(() => Image)
  public async image(@Parent() { image, userImageID }: User) {
    if (!userImageID) {
      return null;
    }

    if (image !== undefined) {
      return image;
    }

    return this.imageDataloaderService.load(userImageID);
  }

  @ResolveField(() => UserAddress)
  public async address(@Parent() { id: userId, address }: User) {
    if (address !== undefined) {
      return address;
    }

    return this.prisma.userAddress.findUnique({
      where: { userId },
    });
  }

  @ResolveField(() => [PaymentProviderCustomer], { nullable: true })
  public async paymentProviderCustomers(
    @Parent() { id: userId, paymentProviderCustomers }: User
  ) {
    if (paymentProviderCustomers !== undefined) {
      return paymentProviderCustomers;
    }

    return this.prisma.paymentProviderCustomer.findMany({
      where: { userId },
    });
  }

  @ResolveField(() => [Property])
  public async properties(@Parent() { id: userId, properties }: User) {
    if (properties !== undefined) {
      return properties;
    }

    return this.prisma.metadataProperty.findMany({
      where: {
        userId,
        public: true,
      },
    });
  }

  @ResolveField(() => [String])
  public async permissions(
    @CurrentUser() user: UserSession | undefined,
    @Parent() { id }: User
  ) {
    if (user?.user.id === id) {
      return user.roles.flatMap(r => r.permissionIDs);
    }

    return [];
  }
}
