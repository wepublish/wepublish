import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaymentProviderCustomer, User, UserAddress } from './user.model';
import { PrismaClient } from '@prisma/client';
import { Property, UserPropertyDataloader } from '@wepublish/property/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { hasPermission } from '@wepublish/permissions/api';
import { CanGetUser } from '@wepublish/permissions';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private prisma: PrismaClient,
    private imageDataloaderService: ImageDataloaderService,
    private propertyDataLoader: UserPropertyDataloader
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

  @ResolveField(() => String)
  public async email(
    @CurrentUser() user: UserSession | undefined,
    @Parent() { id, email }: User
  ) {
    if (user?.user.id === id) {
      return email;
    }

    return '';
  }

  @ResolveField(() => Date, { nullable: true })
  public async birthday(
    @CurrentUser() user: UserSession | undefined,
    @Parent() { id, birthday }: User
  ) {
    if (user?.user.id === id) {
      return birthday;
    }

    return null;
  }

  @ResolveField(() => UserAddress, { nullable: true })
  public async address(
    @CurrentUser() user: UserSession | undefined,
    @Parent() { id, address }: User
  ) {
    if (user?.user.id === id) {
      if (address !== undefined) {
        return address;
      }

      return this.prisma.userAddress.findUnique({
        where: { userId: id },
      });
    }

    return null;
  }

  @ResolveField(() => [PaymentProviderCustomer])
  public async paymentProviderCustomers(
    @CurrentUser() user: UserSession | undefined,
    @Parent() { id, paymentProviderCustomers }: User
  ) {
    if (user?.user.id === id) {
      if (paymentProviderCustomers !== undefined) {
        return paymentProviderCustomers;
      }

      return this.prisma.paymentProviderCustomer.findMany({
        where: { userId: id },
      });
    }

    return [];
  }

  @ResolveField(() => [Property])
  public async properties(
    @Parent() { id: userId }: User,
    @CurrentUser() user: UserSession | undefined
  ) {
    const properties = await this.propertyDataLoader.load(userId);

    return properties?.filter(
      prop => prop.public || hasPermission(CanGetUser, user?.roles ?? [])
    );
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
