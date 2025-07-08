import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {OAuth2Account, PaymentProviderCustomer, User, UserAddress} from './user.model'
import {PrismaClient} from '@prisma/client'
import {PublicProperty} from '@wepublish/utils/api'
import {Image, ImageDataloaderService} from '@wepublish/image/api'

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly imageDataloaderService: ImageDataloaderService
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

  @ResolveField(() => [PublicProperty])
  public async properties(@Parent() {id: userId, properties}: User) {
    if (properties !== undefined) {
      return properties
    }

    return this.prisma.metadataProperty.findMany({
      where: {
        userId,
        public: true
      }
    })
  }

  @ResolveField(() => [String])
  public async permissions(@Parent() {roleIDs}: User) {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        id: {
          in: roleIDs
        }
      }
    })
    return userRoles.flatMap(r => r.permissionIDs)
  }
}
