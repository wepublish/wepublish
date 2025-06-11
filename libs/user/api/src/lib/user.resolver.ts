import {Args, Mutation, Resolver} from '@nestjs/graphql'
import {Authenticated, CurrentUser, UserSession} from '@wepublish/authentication/api'
import {PublicSubscription} from '@wepublish/membership/api'
import {UserService} from './user.service'
import {PaymentProviderCustomer, PaymentProviderCustomerInput, User} from './user.model'
import {UserInputError} from '@nestjs/apollo'
import {UploadImageInput} from '@wepublish/image/api'
import {ProfileService} from './profile.service'

@Resolver(() => PublicSubscription)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService
  ) {}

  @Authenticated()
  @Mutation(() => [PaymentProviderCustomer], {
    description: `This mutation allows to update the Payment Provider Customers`
  })
  async updatePaymentProviderCustomers(
    @Args('input', {type: () => [PaymentProviderCustomerInput]})
    input: PaymentProviderCustomerInput[],
    @CurrentUser() session: UserSession
  ) {
    const user = await this.userService.updatePaymentProviderCustomers(session.user.id, input)

    if (!user) {
      throw new UserInputError(`User not found ${session.user.id}`)
    }
    return user.paymentProviderCustomers
  }

  @Authenticated()
  @Mutation(() => User, {
    nullable: true,
    description: `This mutation allows to upload and update the user's profile image.`
  })
  async uploadUserProfileImage(
    @Args('uploadImageInput', {
      type: () => UploadImageInput,
      nullable: true
    })
    uploadImageInput: UploadImageInput | null,
    @CurrentUser() session: UserSession
  ) {
    return this.profileService.uploadUserProfileImage(session.user, uploadImageInput)
  }
}
