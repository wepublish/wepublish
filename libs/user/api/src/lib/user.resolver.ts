import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {OAuth2Account, PaymentProviderCustomer, User, UserAddress} from './user.model'
import {PrismaClient} from '@prisma/client'
import {Property, UserPropertyDataloader} from '@wepublish/property/api'
import {Image, ImageDataloaderService} from '@wepublish/image/api'
import {CurrentUser, UserSession} from '@wepublish/authentication/api'
import {hasPermission} from '@wepublish/permissions/api'
import {CanGetUser} from '@wepublish/permissions'

@Resolver(() => User)
export class UserResolver {
  constructor(
    private prisma: PrismaClient,
    private imageDataloaderService: ImageDataloaderService,
    private propertyDataLoader: UserPropertyDataloader
  ) {}

  @ResolveField(() => Image)
  public async image(@Parent() {image, userImageID}: User) {
    if (!userImageID) {
      return null
    }

    if (image !== undefined) {
      return image
    }

    return this.imageDataloaderService.load(userImageID)
  }

  @ResolveField(() => UserAddress)
  public async address(@Parent() {id: userId, address}: User) {
    if (address !== undefined) {
      return address
    }

    return this.prisma.userAddress.findUnique({
      where: {userId}
    })
  }

  @ResolveField(() => [PaymentProviderCustomer], {nullable: true})
  public async paymentProviderCustomers(@Parent() {id: userId, paymentProviderCustomers}: User) {
    if (paymentProviderCustomers !== undefined) {
      return paymentProviderCustomers
    }

    return this.prisma.paymentProviderCustomer.findMany({
      where: {userId}
    })
  }

  @ResolveField(() => [OAuth2Account])
  public async oauth2Accounts(@Parent() {id: userId, oauth2Accounts}: User) {
    if (oauth2Accounts !== undefined) {
      return oauth2Accounts
    }
    return this.prisma.userOAuth2Account.findMany({
      where: {userId}
    })
  }

  @ResolveField(() => [Property])
  public async properties(
    @Parent() {id: userId}: User,
    @CurrentUser() user: UserSession | undefined
  ) {
    const properties = await this.propertyDataLoader.load(userId)

    return properties?.filter(prop => prop.public || hasPermission(CanGetUser, user?.roles ?? []))
  }

  @ResolveField(() => [String])
  public async permissions(@CurrentUser() user: UserSession | undefined, @Parent() {id}: User) {
    if (user?.user.id === id) {
      return user.roles.flatMap(r => r.permissionIDs)
    }

    return []
  }
}
